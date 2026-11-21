"""Google Drive provider. Scope drive.file: the user picks files in the Picker and we only see those.

Google Docs are exported to DOCX. Other binaries are downloaded as they are. Uploads are multipart up to 5 MB,
resumable above that. Only Google-side calls live here; routes and the token lifecycle are in routes_* and tokens.py.
"""
import base64
import json
import logging
import uuid
from urllib.parse import quote, urlencode

import requests

from ..config import google_cfg
from .base import MAX_BYTES, AccessResult, Provider, ProviderError, TokenResult, UploadResult

log = logging.getLogger("connectors")

AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
TOKEN_URL = "https://oauth2.googleapis.com/token"
REVOKE_URL = "https://oauth2.googleapis.com/revoke"
FILES_URL = "https://www.googleapis.com/drive/v3/files"
UPLOAD_URL = "https://www.googleapis.com/upload/drive/v3/files"
UPLOAD_HOST = "https://www.googleapis.com/upload/"
TIMEOUT = (5, 30)
SIMPLE_MAX = 5 * 1024 * 1024
CHUNK = 64 * 1024
DRIVE_FILE_SCOPE = "https://www.googleapis.com/auth/drive.file"
DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
NOT_GRANTED = "File not available to this app. Pick it again with the Google picker"
TOO_LARGE = "File is larger than 25 MB"


def _call(verb, url, **kwargs):
    """Every outbound call goes through here: timeout always set, exception text never leaves this module."""
    try:
        return verb(url, timeout=TIMEOUT, **kwargs)
    except requests.RequestException as err:
        log.warning("google request failed error=%s", type(err).__name__)
        raise ProviderError("upstream", "Google could not be reached")


def _raise_for_status(status, not_found="File not found"):
    if status < 400:
        return
    if status == 401:
        raise ProviderError("reconnect", "Please reconnect this account")
    if status == 403:
        raise ProviderError("forbidden", "Google denied access")
    if status == 404:
        raise ProviderError("not_found", not_found)
    if status >= 500:
        raise ProviderError("upstream", "Google is unavailable, try again")
    raise ProviderError("bad_request", "Google rejected the request")


def _token_error(resp):
    """invalid_grant means the stored refresh token is dead, the user must connect again."""
    try:
        code = resp.json().get("error")
    except (ValueError, AttributeError):
        code = None
    if code == "invalid_grant":
        raise ProviderError("reconnect", "Please reconnect this account")
    raise ProviderError("upstream", "Google token request failed")


def _json(resp):
    try:
        body = resp.json()
    except ValueError:
        body = None
    if not isinstance(body, dict):
        raise ProviderError("upstream", "Google sent an unexpected response")
    return body


def _email_from_id_token(token):
    """Label only. The id_token came straight from Google over TLS, so the signature is not re-checked."""
    try:
        part = token.split(".")[1]
        part += "=" * (-len(part) % 4)
        claims = json.loads(base64.urlsafe_b64decode(part.encode("ascii")))
    except (AttributeError, IndexError, ValueError, TypeError):
        return ""
    email = claims.get("email") if isinstance(claims, dict) else None
    return email if isinstance(email, str) else ""


def _open(url, headers, params):
    """Starts a streamed GET. Error statuses are raised before any body is read."""
    resp = _call(requests.get, url, headers=headers, params=params, stream=True)
    if resp.status_code >= 400:
        resp.close()
        _raise_for_status(resp.status_code, NOT_GRANTED)
    return resp


def _read_capped(resp):
    """Reads the body chunk by chunk and stops at MAX_BYTES. The response is always closed."""
    try:
        try:
            declared = int(resp.headers.get("Content-Length") or 0)
        except (TypeError, ValueError):
            declared = 0
        if declared > MAX_BYTES:
            raise ProviderError("too_large", TOO_LARGE)
        buf = bytearray()
        for chunk in resp.iter_content(chunk_size=CHUNK):
            buf.extend(chunk)
            if len(buf) > MAX_BYTES:
                raise ProviderError("too_large", TOO_LARGE)
        return bytes(buf)
    except requests.RequestException:
        raise ProviderError("upstream", "Google download was interrupted")
    finally:
        resp.close()


def _send_upload(access_token, metadata, data, mimetype):
    """Returns the final response. A failed init call is returned as-is so the caller can inspect its status."""
    auth = {"Authorization": f"Bearer {access_token}"}
    if len(data) <= SIMPLE_MAX:
        boundary = uuid.uuid4().hex
        body = (f"--{boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n"
                f"{json.dumps(metadata)}\r\n--{boundary}\r\nContent-Type: {mimetype}\r\n\r\n").encode("utf-8")
        body += data + f"\r\n--{boundary}--".encode("ascii")
        headers = {**auth, "Content-Type": f"multipart/related; boundary={boundary}"}
        return _call(requests.post, f"{UPLOAD_URL}?uploadType=multipart&fields=id,name,webViewLink",
                     headers=headers, data=body)
    init = _call(requests.post, f"{UPLOAD_URL}?uploadType=resumable&fields=id,name,webViewLink",
                 headers={**auth, "Content-Type": "application/json; charset=UTF-8",
                          "X-Upload-Content-Type": mimetype},
                 data=json.dumps(metadata).encode("utf-8"))
    if init.status_code >= 400:
        return init
    location = init.headers.get("Location") or ""
    if not location.startswith(UPLOAD_HOST):
        raise ProviderError("upstream", "Google sent an unexpected upload location")
    return _call(requests.put, location, headers={**auth, "Content-Type": mimetype}, data=data)


class GoogleProvider(Provider):
    id = "google"
    display_name = "Google Drive"
    uses_pkce = False
    scopes = "openid email " + DRIVE_FILE_SCOPE

    def is_configured(self):
        cfg = google_cfg()
        return bool(cfg["client_id"] and cfg["client_secret"])

    def auth_url(self, state, redirect_uri, code_challenge=None):
        cfg = google_cfg()
        query = {"client_id": cfg["client_id"], "redirect_uri": redirect_uri, "response_type": "code",
                 "scope": self.scopes, "access_type": "offline", "prompt": "consent",
                 "include_granted_scopes": "true", "state": state}
        return "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(query)

    def exchange_code(self, code, redirect_uri, code_verifier=None):
        cfg = google_cfg()
        resp = _call(requests.post, TOKEN_URL, data={
            "code": code, "client_id": cfg["client_id"], "client_secret": cfg["client_secret"],
            "redirect_uri": redirect_uri, "grant_type": "authorization_code"})
        if resp.status_code != 200:
            _token_error(resp)
        body = _json(resp)
        refresh = body.get("refresh_token")
        if not refresh:
            raise ProviderError("bad_request", "No refresh token returned. Remove the app from your Google "
                                               "account permissions and retry")
        granted = str(body.get("scope") or "")
        if DRIVE_FILE_SCOPE not in granted.split():
            raise ProviderError("bad_request", "Drive access was not granted")
        return TokenResult(access_token=str(body.get("access_token") or ""), refresh_token=refresh,
                           expires_in=int(body.get("expires_in") or 3600),
                           account_label=_email_from_id_token(body.get("id_token")) or "Google account",
                           scopes=granted)

    def refresh(self, refresh_token):
        cfg = google_cfg()
        resp = _call(requests.post, TOKEN_URL, data={
            "client_id": cfg["client_id"], "client_secret": cfg["client_secret"],
            "refresh_token": refresh_token, "grant_type": "refresh_token"})
        if resp.status_code != 200:
            _token_error(resp)
        body = _json(resp)
        access = body.get("access_token")
        if not access:
            raise ProviderError("upstream", "Google token request failed")
        # Google does not rotate refresh tokens, so there is nothing to persist.
        return AccessResult(access_token=str(access), expires_in=int(body.get("expires_in") or 3600))

    def revoke(self, refresh_token):
        try:
            requests.post(REVOKE_URL, data={"token": refresh_token}, timeout=TIMEOUT)
        except Exception as err:  # best effort: the stored token is deleted either way
            log.info("google revoke skipped error=%s", type(err).__name__)

    def list_files(self, access_token, folder_id, page_token):
        raise ProviderError("bad_request", "Use the Google file picker")

    def download(self, access_token, file_id):
        headers = {"Authorization": f"Bearer {access_token}"}
        url = f"{FILES_URL}/{quote(file_id, safe='')}"
        meta_resp = _call(requests.get, url, headers=headers,
                          params={"fields": "id,name,mimeType,size", "supportsAllDrives": "true"})
        _raise_for_status(meta_resp.status_code, NOT_GRANTED)
        meta = _json(meta_resp)
        name = str(meta.get("name") or "file")
        mime = str(meta.get("mimeType") or "application/octet-stream")
        if mime.startswith("application/vnd.google-apps."):
            if mime != "application/vnd.google-apps.document":
                raise ProviderError("bad_request", "Unsupported Google file type")
            resp = _open(url + "/export", headers, {"mimeType": DOCX})
            if not name.lower().endswith(".docx"):
                name += ".docx"
            return name, _read_capped(resp), DOCX
        size = meta.get("size")
        if size is not None and int(size) > MAX_BYTES:
            raise ProviderError("too_large", TOO_LARGE)
        resp = _open(url, headers, {"alt": "media", "supportsAllDrives": "true"})
        return name, _read_capped(resp), mime

    def upload(self, access_token, filename, data, mimetype, folder_id):
        if len(data) > MAX_BYTES:
            raise ProviderError("too_large", TOO_LARGE)
        metadata = {"name": filename, "mimeType": mimetype}
        if folder_id:
            metadata["parents"] = [folder_id]
        resp = _send_upload(access_token, metadata, data, mimetype)
        placed = True
        # shortcut: any 403/404 on a folder write retries once without parents, saving to My Drive instead
        if folder_id and resp.status_code in (403, 404):
            metadata.pop("parents")
            resp = _send_upload(access_token, metadata, data, mimetype)
            placed = False
        _raise_for_status(resp.status_code)
        body = _json(resp)
        if not body.get("id"):
            raise ProviderError("upstream", "Google sent an unexpected response")
        return UploadResult(id=str(body["id"]), name=str(body.get("name") or filename),
                            web_url=body.get("webViewLink"), placed_in_folder=placed)
