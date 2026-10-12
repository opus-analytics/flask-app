import hashlib
import html
import re

from flask import g, jsonify, request

from . import blob_storage, repo_site, riddlex_bp
from .auth import org_required
from .errors import ApiError
from .schemas import MAX_LOGO_BYTES, validate_career_site

_LOGO_MSG = "The logo must be a PNG, JPG or SVG image under 300 KB."
# `<(prefix:)?script` catches namespace-prefixed elements (<x:script xmlns:x="...svg">).
_SVG_BAD = re.compile(
    r"<\s*(?:[\w.-]+:)?(?:script|foreignobject|iframe|embed|object)\b|<!entity|(?<![\w-])on\w+\s*=",
    re.IGNORECASE,
)
# URL schemes are checked on text with whitespace/control chars removed: browsers strip TAB/LF/CR
# inside URLs, so `java&#9;script:` would otherwise slip through.
_SVG_BAD_SCHEME = re.compile(r"(?:java|vb)script:|data:text/html", re.IGNORECASE)
_WS = re.compile(r"[\x00-\x20]+")

if blob_storage.is_local():
    blob_storage.register_dev_files(riddlex_bp)


def sniff_logo(data: bytes):
    """Return (ext, content_type) from magic bytes / safe SVG text, or None if unacceptable."""
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png", "image/png"
    if data.startswith(b"\xff\xd8\xff"):
        return "jpg", "image/jpeg"
    try:
        text = data.decode("utf-8-sig")
    except UnicodeDecodeError:
        return None
    head = text.lstrip().lower()
    if not (head.startswith("<svg") or head.startswith("<?xml")) or "<svg" not in head:
        return None
    unescaped = html.unescape(text)
    if _SVG_BAD.search(text) or _SVG_BAD.search(unescaped):
        return None
    if any(_SVG_BAD_SCHEME.search(_WS.sub("", t)) for t in (text, unescaped)):
        return None
    return "svg", "image/svg+xml"


def _logo_base() -> str:
    return blob_storage.public_base_url(blob_storage.logo_container())


@riddlex_bp.route("/career-site", methods=["GET"])
@org_required
def get_career_site():
    return jsonify(repo_site.get_site(g.org_email))  # None -> JSON null


@riddlex_bp.route("/career-site", methods=["PUT"])
@org_required
def put_career_site():
    cfg = validate_career_site(request.get_json(silent=True), logo_base_url=_logo_base())
    if not repo_site.upsert_site(g.org_email, cfg):
        raise ApiError(409, "That career site URL is taken.")
    return jsonify(repo_site.get_site(g.org_email))


@riddlex_bp.route("/career-site/logo", methods=["POST"])
@org_required
def upload_logo():
    if request.content_length is not None and request.content_length > MAX_LOGO_BYTES + 16 * 1024:
        raise ApiError(400, _LOGO_MSG)
    f = request.files.get("file")
    if f is None:
        raise ApiError(400, "Choose a logo file to upload.")
    data = f.read(MAX_LOGO_BYTES + 1)
    if len(data) > MAX_LOGO_BYTES:
        raise ApiError(400, _LOGO_MSG)
    kind = sniff_logo(data)
    if kind is None:
        raise ApiError(400, _LOGO_MSG)
    ext, content_type = kind
    path = f"logos/{hashlib.sha256(data).hexdigest()}.{ext}"
    url = blob_storage.upload(blob_storage.logo_container(), path, data, content_type)
    return jsonify({"logoUrl": url})
