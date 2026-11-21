"""OneDrive (Microsoft Graph) provider for personal and work accounts (common endpoint).

Disconnect does not revoke anything at Microsoft: personal accounts have no revoke endpoint, and
revokeSignInSessions would sign the user out of every session for work accounts. The caller deletes
our stored token; the user can also remove the app at https://account.live.com/consent/Manage
(personal) or https://myapps.microsoft.com (work).
"""
from urllib.parse import quote, urlencode

import requests

from ..config import ms_cfg
from ..util import valid_id
from .base import MAX_BYTES, AccessResult, FileEntry, FilePage, Provider, ProviderError, TokenResult, UploadResult

AUTH_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize"
TOKEN_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/token"
GRAPH = "https://graph.microsoft.com/v1.0"
GRAPH_PREFIX = "https://graph.microsoft.com/"  # SSRF guard for @odata.nextLink
TIMEOUT = (5, 30)
CHUNK = 64 * 1024
RECONNECT_ERRORS = {"invalid_grant", "interaction_required"}
LIST_SELECT = "id,name,size,folder,file,lastModifiedDateTime,webUrl,parentReference"
DOWNLOAD_SELECT = "id,name,size,file,@microsoft.graph.downloadUrl"


def _check(resp):
    """Map a Graph response status to ProviderError. Response bodies are never echoed (they may hold tokens)."""
    code = resp.status_code
    if 200 <= code < 300:
        return
    if code == 401:
        raise ProviderError("reconnect", "Please reconnect this account")
    if code == 403:
        raise ProviderError("forbidden", "OneDrive denied access to this item")
    if code == 404:
        raise ProviderError("not_found", "Item not found in OneDrive")
    if code == 413:
        raise ProviderError("too_large", "File is too large")
    if 400 <= code < 500 and code != 429:
        raise ProviderError("bad_request", "OneDrive rejected the request")
    raise ProviderError("upstream", "OneDrive is unavailable")


def _send(fn, url, token=None, **kwargs):
    headers = dict(kwargs.pop("headers", None) or {})
    if token:
        headers["Authorization"] = "Bearer " + token
    try:
        resp = fn(url, headers=headers, timeout=TIMEOUT, **kwargs)
    except requests.RequestException:
        raise ProviderError("upstream", "OneDrive did not respond")
    _check(resp)
    return resp


def _json(resp) -> dict:
    try:
        body = resp.json()
    except ValueError:
        body = None
    if not isinstance(body, dict):
        raise ProviderError("upstream", "Unexpected response from OneDrive")
    return body


def _token_post(data: dict) -> dict:
    try:
        resp = requests.post(TOKEN_URL, data=data, timeout=TIMEOUT)
    except requests.RequestException:
        raise ProviderError("upstream", "OneDrive did not respond")
    if resp.status_code == 200:
        return _json(resp)
    try:
        error = resp.json().get("error")  # read for classification only, never echoed
    except (ValueError, AttributeError):
        error = None
    if resp.status_code == 401 or error in RECONNECT_ERRORS:
        raise ProviderError("reconnect", "Please reconnect this account")
    if resp.status_code >= 500 or resp.status_code == 429:
        raise ProviderError("upstream", "OneDrive is unavailable")
    raise ProviderError("bad_request", "OneDrive rejected the sign-in request")


def _expires(data: dict) -> int:
    return int(data.get("expires_in") or 3600)


def _account_label(access_token: str) -> str:
    body = _json(_send(requests.get, GRAPH + "/me?$select=displayName,mail,userPrincipalName", access_token))
    for key in ("mail", "userPrincipalName", "displayName"):
        value = body.get(key)
        if value:
            return str(value)[:255]
    return "OneDrive"


def _entry(item: dict) -> FileEntry:
    file_facet = item.get("file") or {}
    return FileEntry(id=str(item.get("id") or ""), name=str(item.get("name") or ""),
                     is_folder="folder" in item, size=item.get("size"),
                     mime_type=file_facet.get("mimeType"), modified=item.get("lastModifiedDateTime"),
                     web_url=item.get("webUrl"))


class OneDriveProvider(Provider):
    id = "onedrive"
    display_name = "OneDrive"
    uses_pkce = True
    scopes = "Files.ReadWrite offline_access User.Read"

    def is_configured(self) -> bool:
        cfg = ms_cfg()
        return bool(cfg["client_id"] and cfg["client_secret"])

    def auth_url(self, state, redirect_uri, code_challenge=None):
        if not code_challenge:
            raise ProviderError("bad_request", "PKCE challenge is required")
        query = {"client_id": ms_cfg()["client_id"], "response_type": "code", "redirect_uri": redirect_uri,
                 "response_mode": "query", "scope": self.scopes, "state": state, "prompt": "select_account",
                 "code_challenge": code_challenge, "code_challenge_method": "S256"}
        return AUTH_URL + "?" + urlencode(query)

    def exchange_code(self, code, redirect_uri, code_verifier=None):
        if not code_verifier:
            raise ProviderError("bad_request", "PKCE verifier is required")
        cfg = ms_cfg()
        data = _token_post({"client_id": cfg["client_id"], "client_secret": cfg["client_secret"], "code": code,
                            "redirect_uri": redirect_uri, "grant_type": "authorization_code",
                            "code_verifier": code_verifier, "scope": self.scopes})
        refresh_token = data.get("refresh_token")
        access_token = data.get("access_token")
        if not refresh_token:
            raise ProviderError("bad_request", "offline_access was not granted")
        if not access_token:
            raise ProviderError("upstream", "OneDrive returned no access token")
        return TokenResult(access_token=access_token, refresh_token=refresh_token, expires_in=_expires(data),
                           account_label=_account_label(access_token), scopes=data.get("scope") or self.scopes)

    def refresh(self, refresh_token):
        cfg = ms_cfg()
        data = _token_post({"client_id": cfg["client_id"], "client_secret": cfg["client_secret"],
                            "refresh_token": refresh_token, "grant_type": "refresh_token", "scope": self.scopes})
        access_token = data.get("access_token")
        if not access_token:
            raise ProviderError("upstream", "OneDrive returned no access token")
        # Microsoft rotates the refresh token on every use: the caller must persist new_refresh_token.
        return AccessResult(access_token=access_token, expires_in=_expires(data),
                            new_refresh_token=data.get("refresh_token"))

    def revoke(self, refresh_token):
        """No-op by design: no revoke endpoint exists for personal accounts, and revokeSignInSessions
        would sign the user out of every session for work accounts. Disconnect deletes our token only."""

    def _folder_context(self, access_token, folder_id):
        url = GRAPH + "/me/drive/items/" + quote(folder_id, safe="")
        body = _json(_send(requests.get, url, access_token, params={"$select": "id,name,parentReference"}))
        parent = body.get("parentReference") or {}
        return body.get("name"), parent.get("id")

    def list_files(self, access_token, folder_id, page_token):
        is_root = not folder_id or folder_id == "root"
        if page_token:
            if not page_token.startswith(GRAPH_PREFIX):
                raise ProviderError("bad_request", "Invalid page token")
            url, params = page_token, None  # the nextLink already carries its own query
        else:
            if is_root:
                url = GRAPH + "/me/drive/root/children"
            else:
                if not valid_id(folder_id):
                    raise ProviderError("bad_request", "Invalid folder id")
                url = GRAPH + "/me/drive/items/" + quote(folder_id, safe="") + "/children"
            params = {"$select": LIST_SELECT, "$top": "100"}
        body = _json(_send(requests.get, url, access_token, params=params))
        items = [_entry(it) for it in (body.get("value") or []) if isinstance(it, dict)]
        items.sort(key=lambda e: (not e.is_folder, e.name.lower()))
        folder_name = parent_id = None
        if not page_token:
            if is_root:
                folder_name = "OneDrive"
            else:
                folder_name, parent_id = self._folder_context(access_token, folder_id)
        return FilePage(items=items, next_page_token=body.get("@odata.nextLink"),
                        folder_id="root" if is_root else folder_id, folder_name=folder_name, parent_id=parent_id)

    def download(self, access_token, file_id):
        if not valid_id(file_id):
            raise ProviderError("bad_request", "Invalid file id")
        item_url = GRAPH + "/me/drive/items/" + quote(file_id, safe="")
        meta = _json(_send(requests.get, item_url, access_token, params={"$select": DOWNLOAD_SELECT}))
        file_facet = meta.get("file")
        if not isinstance(file_facet, dict):
            raise ProviderError("bad_request", "Only files can be downloaded")
        size = meta.get("size")
        if isinstance(size, int) and size > MAX_BYTES:
            raise ProviderError("too_large", "File is larger than 25 MB")
        # /content answers 302 to a pre-authenticated URL; requests drops the bearer header on that cross-host hop.
        resp = _send(requests.get, item_url + "/content", access_token, allow_redirects=True, stream=True)
        try:
            declared = resp.headers.get("Content-Length")
            if declared and str(declared).isdigit() and int(declared) > MAX_BYTES:
                raise ProviderError("too_large", "File is larger than 25 MB")
            chunks, total = [], 0
            for chunk in resp.iter_content(chunk_size=CHUNK):
                total += len(chunk)
                if total > MAX_BYTES:
                    raise ProviderError("too_large", "File is larger than 25 MB")
                chunks.append(chunk)
        finally:
            resp.close()
        mimetype = file_facet.get("mimeType") or "application/octet-stream"
        return meta.get("name") or "file", b"".join(chunks), mimetype

    def upload(self, access_token, filename, data, mimetype, folder_id):
        if len(data) > MAX_BYTES:
            raise ProviderError("too_large", "File is larger than 25 MB")
        if not folder_id or folder_id == "root":
            base = GRAPH + "/me/drive/root:/"
        else:
            if not valid_id(folder_id):
                raise ProviderError("bad_request", "Invalid folder id")
            base = GRAPH + "/me/drive/items/" + quote(folder_id, safe="") + ":/"
        # shortcut: simple PUT only (limit 250 MB), capped at 25 MB; no upload session.
        url = base + quote(filename, safe="") + ":/content?@microsoft.graph.conflictBehavior=rename"
        resp = _send(requests.put, url, access_token,
                     headers={"Content-Type": mimetype or "application/octet-stream"}, data=data)
        body = _json(resp)
        if not body.get("id"):
            raise ProviderError("upstream", "Unexpected response from OneDrive")
        return UploadResult(id=str(body["id"]), name=str(body.get("name") or filename), web_url=body.get("webUrl"))
