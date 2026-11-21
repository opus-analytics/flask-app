"""Filename and id helpers for the connector routes (security rules F.5 and F.7)."""
import re
import unicodedata
from urllib.parse import quote

MAX_NAME = 150
_ID_RE = re.compile(r"(?!\.+\Z)[A-Za-z0-9!_\-\.]{1,200}")  # dot-only ids ('.', '..') would resolve as paths
_CONTROL = re.compile(r"[\x00-\x1f\x7f]")
_RESERVED = re.compile(r'[<>:"/\\|?*]')
_SPACES = re.compile(r"\s+")


def sanitize_filename(name, default="file"):
    """Basename only, no control or reserved chars, max 150 chars keeping the extension."""
    name = str(name or "").replace("\\", "/").split("/")[-1]
    name = _RESERVED.sub("", _CONTROL.sub("", name))
    name = _SPACES.sub(" ", name).strip(". ")
    if len(name) > MAX_NAME:
        stem, dot, ext = name.rpartition(".")
        if dot and len(ext) <= 10:
            name = stem[: MAX_NAME - len(ext) - 1] + "." + ext
        else:
            name = name[:MAX_NAME]
    return name or default


def valid_id(value) -> bool:
    """Provider file/folder ids from the client: safe to place in a provider URL."""
    return isinstance(value, str) and _ID_RE.fullmatch(value) is not None


def content_disposition(filename: str) -> str:
    """attachment header with an ASCII fallback plus an RFC 5987 UTF-8 name."""
    ascii_name = unicodedata.normalize("NFKD", filename).encode("ascii", "ignore").decode("ascii")
    ascii_name = ascii_name.replace('"', "").replace("\\", "")
    stem, dot, ext = ascii_name.rpartition(".")
    if not stem:  # nothing left before the extension, so "file" stands in for the stem
        ascii_name = "file" + (dot + ext if dot else "")
    return f"attachment; filename=\"{ascii_name}\"; filename*=UTF-8''{quote(filename, safe='')}"
