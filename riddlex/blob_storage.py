"""Blob storage for RiddleX (logos: public-read container; resumes: private container).

Azure is used when AZURE_STORAGE_CONNECTION_STRING is set (and RIDDLEX_STORAGE != "local").
Otherwise a local-disk fallback writes under uploads/riddlex/<container>/<path> (override the
base dir with RIDDLEX_LOCAL_DIR) and serves logos through a dev-only route.

Blob paths must never contain an email / org identifier; callers use content hashes or UUIDs.
"""
import datetime
import hashlib
import hmac
import mimetypes
import os
import secrets
import time
from pathlib import Path

from flask import abort, request, send_file

DEV_FILES_PREFIX = "/api/riddlex/_dev_files"
_DEFAULT_LOCAL_DIR = Path(__file__).resolve().parents[1] / "uploads" / "riddlex"
# Per-process fallback; signed private URLs therefore die on restart (fine for dev).
_PROCESS_SECRET = secrets.token_bytes(32)


# ---------------------------------------------------------------- configuration

def logo_container() -> str:
    return os.environ.get("RIDDLEX_LOGO_CONTAINER") or "riddlex-logos"


def resume_container() -> str:
    return os.environ.get("RIDDLEX_RESUME_CONTAINER") or "riddlex-resumes"


def is_local() -> bool:
    mode = (os.environ.get("RIDDLEX_STORAGE") or "").strip().lower()
    if mode == "local":
        return True
    if mode == "azure":
        return False
    return not os.environ.get("AZURE_STORAGE_CONNECTION_STRING")


def local_base_dir() -> Path:
    return Path(os.environ.get("RIDDLEX_LOCAL_DIR") or _DEFAULT_LOCAL_DIR).resolve()


# ---------------------------------------------------------------- path safety

def _check_segment(value: str, what: str) -> None:
    if (
        not isinstance(value, str)
        or not value
        or "\x00" in value
        or "\\" in value
        or value.startswith("/")
        or any(part in ("", ".", "..") for part in value.split("/"))
        or (len(value) > 1 and value[1] == ":")  # drive letters on Windows
    ):
        raise ValueError(f"invalid blob {what}")


def _safe_local_path(container: str, path: str) -> Path:
    """Resolve <base>/<container>/<path>, guaranteeing it stays inside the base dir."""
    _check_segment(container, "container")
    if "/" in container:
        raise ValueError("invalid blob container")
    _check_segment(path, "path")
    base = local_base_dir()
    target = (base / container / path).resolve()
    if not target.is_relative_to(base / container):
        raise ValueError("invalid blob path")
    return target


# ---------------------------------------------------------------- Azure

def _service():
    from azure.storage.blob import BlobServiceClient

    return BlobServiceClient.from_connection_string(os.environ["AZURE_STORAGE_CONNECTION_STRING"])


def public_base_url(container: str) -> str:
    """URL prefix every public blob in `container` starts with (used to validate stored logo URLs)."""
    if is_local():
        return f"{DEV_FILES_PREFIX}/{container}/"
    return f"{_service().url.rstrip('/')}/{container}/"


# ---------------------------------------------------------------- public API

def upload(container: str, path: str, data: bytes, content_type: str) -> str:
    """Store `data` and return its public URL (only meaningful for the public-read logo container)."""
    _check_segment(path, "path")
    if is_local():
        target = _safe_local_path(container, path)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
        return f"{DEV_FILES_PREFIX}/{container}/{path}"

    from azure.core.exceptions import ResourceExistsError
    from azure.storage.blob import ContentSettings

    service = _service()
    client = service.get_container_client(container)
    if container == logo_container():
        try:
            client.create_container(public_access="blob")
        except ResourceExistsError:
            pass
    blob = client.get_blob_client(path)
    blob.upload_blob(
        data,
        overwrite=True,
        content_settings=ContentSettings(
            content_type=content_type, cache_control="public, max-age=31536000, immutable"
        ),
    )
    return blob.url


def delete(container: str, path: str) -> None:
    """Delete a blob; a missing blob is not an error (idempotent)."""
    _check_segment(path, "path")
    if is_local():
        _safe_local_path(container, path).unlink(missing_ok=True)
        return

    from azure.core.exceptions import ResourceNotFoundError

    try:
        _service().get_container_client(container).delete_blob(path)
    except ResourceNotFoundError:
        pass


def download_url(container: str, path: str, ttl_minutes: int = 15) -> str:
    """Time-limited read URL for a private blob (Azure SAS; signed dev URL in local mode)."""
    _check_segment(path, "path")
    if is_local():
        _safe_local_path(container, path)
        exp = int(time.time()) + ttl_minutes * 60
        return f"{DEV_FILES_PREFIX}/{container}/{path}?exp={exp}&sig={_sign(container, path, exp)}"

    from azure.storage.blob import BlobSasPermissions, generate_blob_sas

    service = _service()
    token = generate_blob_sas(
        account_name=service.account_name,
        container_name=container,
        blob_name=path,
        account_key=service.credential.account_key,
        permission=BlobSasPermissions(read=True),
        expiry=datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=ttl_minutes),
    )
    return f"{service.url.rstrip('/')}/{container}/{path}?{token}"


# ---------------------------------------------------------------- local dev file route

def _sign(container: str, path: str, exp: int) -> str:
    key = (os.environ.get("RIDDLEX_DEV_FILES_SECRET") or "").encode() or _PROCESS_SECRET
    return hmac.new(key, f"{container}/{path}|{exp}".encode(), hashlib.sha256).hexdigest()


def register_dev_files(bp) -> None:
    """Add GET /_dev_files/<container>/<path> to `bp`. Call ONLY when is_local() is true."""

    @bp.route("/_dev_files/<container>/<path:path>", methods=["GET"])
    def dev_files(container, path):
        if not is_local():
            abort(404)
        if container != logo_container():
            # Private containers (resumes) are only reachable with an unexpired signed URL.
            try:
                exp = int(request.args.get("exp", ""))
            except ValueError:
                abort(404)
            sig = request.args.get("sig", "")
            # Compare bytes: compare_digest raises TypeError on non-ASCII str (would be a 500).
            if container != resume_container() or exp < time.time() or not hmac.compare_digest(
                sig.encode("utf-8"), _sign(container, path, exp).encode("ascii")
            ):
                abort(404)
        try:
            target = _safe_local_path(container, path)
        except ValueError:
            abort(404)
        if not target.is_file():
            abort(404)
        mime = mimetypes.guess_type(target.name)[0] or "application/octet-stream"
        resp = send_file(target, mimetype=mime)
        resp.headers["X-Content-Type-Options"] = "nosniff"
        resp.headers["Content-Security-Policy"] = "default-src 'none'; style-src 'unsafe-inline'; sandbox"
        return resp
