"""Provider-agnostic file routes: list, download, upload. Dispatch goes through the provider registry (sections D and F)."""
import mimetypes
import os
import re

from flask import Response, jsonify, request

from riddlex.limits import limiter
from routes.auth import auth

from . import connectors_bp
from .errors import ConnectorError
from .providers.base import MAX_BYTES
from .routes_core import _provider_id
from .tokens import get_access_token
from .util import content_disposition, sanitize_filename, valid_id

MB = 1024 * 1024
TOO_LARGE = "File is larger than 25 MB"
DOWNLOAD_EXTS = {".pdf", ".docx", ".doc"}
UPLOAD_EXTS = {".docx", ".pdf", ".doc", ".md", ".txt", ".csv", ".xlsx", ".json"}
_MIME_RE = re.compile(r"[A-Za-z0-9!#$&^_.+-]+/[A-Za-z0-9!#$&^_.+-]+")


def _safe_mimetype(value):
    """Provider or client mimetypes go into a response header, so only a plain type/subtype is accepted."""
    return value if isinstance(value, str) and _MIME_RE.fullmatch(value) else "application/octet-stream"


@connectors_bp.route("/<provider>/files", methods=["GET"])
@limiter.limit("60/minute")
@auth.login_required
def files_list(provider):
    pid = _provider_id(provider)
    if pid == "google":
        raise ConnectorError(400, "use_picker", "Use the Google file picker")
    folder_id = request.args.get("folderId") or None
    if folder_id is not None and not valid_id(folder_id):
        raise ConnectorError(400, "bad_request", "Invalid folder id")
    prov, token = get_access_token(auth.current_user(), pid)
    page = prov.list_files(token, folder_id, request.args.get("pageToken") or None)
    return jsonify({
        "folderId": page.folder_id,
        "folderName": page.folder_name,
        "parentId": page.parent_id,
        "items": [{"id": i.id, "name": i.name, "isFolder": i.is_folder, "size": i.size,
                   "mimeType": i.mime_type, "modified": i.modified, "webUrl": i.web_url} for i in page.items],
        "nextPageToken": page.next_page_token,
    })


@connectors_bp.route("/<provider>/files/<file_id>/download", methods=["GET"])
@limiter.limit("20/minute")
@auth.login_required
def files_download(provider, file_id):
    pid = _provider_id(provider)
    if not valid_id(file_id):
        raise ConnectorError(400, "bad_request", "Invalid file id")
    prov, token = get_access_token(auth.current_user(), pid)
    # shortcut: the extension check runs after the provider has fetched the file, because the name comes from its metadata
    name, data, mimetype = prov.download(token, file_id)
    name = sanitize_filename(name)
    if os.path.splitext(name)[1].lower() not in DOWNLOAD_EXTS:
        raise ConnectorError(400, "unsupported_type", "Only PDF and Word files can be imported")
    resp = Response(data, content_type=_safe_mimetype(mimetype))
    resp.headers["Content-Disposition"] = content_disposition(name)
    resp.headers["Cache-Control"] = "no-store"
    resp.headers["Access-Control-Expose-Headers"] = "Content-Disposition"
    return resp


@connectors_bp.route("/<provider>/upload", methods=["POST"])
@limiter.limit("20/minute")
@auth.login_required
def files_upload(provider):
    pid = _provider_id(provider)
    # Rejects oversized bodies before Werkzeug parses them. Chunked requests have no Content-Length,
    # so the bounded read below is the real guard.
    if request.content_length and request.content_length > MAX_BYTES + MB:
        raise ConnectorError(413, "too_large", TOO_LARGE)
    upload = request.files.get("file")
    if upload is None:
        raise ConnectorError(400, "missing_file", "No file was uploaded")
    data = upload.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise ConnectorError(413, "too_large", TOO_LARGE)
    filename = sanitize_filename(request.form.get("filename") or upload.filename)
    if os.path.splitext(filename)[1].lower() not in UPLOAD_EXTS:
        raise ConnectorError(400, "unsupported_type", "This file type cannot be saved to the cloud")
    folder_id = request.form.get("folderId") or None
    if folder_id is not None and not valid_id(folder_id):
        raise ConnectorError(400, "bad_request", "Invalid folder id")
    mimetype = _safe_mimetype(upload.mimetype or mimetypes.guess_type(filename)[0])
    prov, token = get_access_token(auth.current_user(), pid)
    result = prov.upload(token, filename, data, mimetype, folder_id)
    return jsonify({"id": result.id, "name": result.name, "webUrl": result.web_url,
                    "placedInFolder": result.placed_in_folder})
