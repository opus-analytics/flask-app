"""Case 10: shared file routes, tenant isolation, reconnect path and the Google token route.

Files routes use a fake provider registered under 'onedrive' via monkeypatch, so they never depend on the
OneDrive module. The Google token route uses the real GoogleProvider with requests mocked.
"""
import io

import pytest
import requests

from connectors import crypto
from connectors.providers.base import MAX_BYTES, PROVIDERS, AccessResult, FileEntry, FilePage, ProviderError, UploadResult

BASE = "/api/connectors"
EMAIL = "a@x.com"
OTHER = "b@x.com"


class FakeResponse:
    def __init__(self, status=200, body=None, headers=None):
        self.status_code = status
        self._body = body
        self.headers = headers or {}

    def json(self):
        if self._body is None:
            raise ValueError("no body")
        return self._body


class FakeFiles:
    id = "onedrive"
    display_name = "OneDrive"
    uses_pkce = True
    scopes = "fake"

    def __init__(self):
        self.refresh_error = None
        self.download_result = ("cv.pdf", b"%PDF-1.4 test", "application/pdf")
        self.download_error = None
        self.page = FilePage(items=[FileEntry(id="f1", name="cv.pdf", is_folder=False, size=10,
                                              mime_type="application/pdf")],
                             next_page_token=None, folder_id="root", folder_name="OneDrive", parent_id=None)
        self.upload_result = UploadResult(id="u1", name="out.docx", web_url="https://web/u1", placed_in_folder=True)
        self.calls = []

    def is_configured(self):
        return True

    def refresh(self, refresh_token):
        if self.refresh_error:
            raise self.refresh_error
        return AccessResult(access_token="ACCESS-FILES", expires_in=3600)

    def list_files(self, access_token, folder_id, page_token):
        self.calls.append(("list", folder_id, page_token))
        return self.page

    def download(self, access_token, file_id):
        self.calls.append(("download", file_id))
        if self.download_error:
            raise self.download_error
        return self.download_result

    def upload(self, access_token, filename, data, mimetype, folder_id):
        self.calls.append(("upload", filename, len(data), mimetype, folder_id))
        return self.upload_result


def _row(email, provider, status="active"):
    return {"user_email": email, "provider": provider, "account_label": email, "status": status,
            "refresh_token_enc": crypto.encrypt("REFRESH-SENTINEL-FILES"), "scopes": "s"}


@pytest.fixture
def files(env, monkeypatch, store):
    fake = FakeFiles()
    monkeypatch.setitem(PROVIDERS, "onedrive", fake)
    store.accounts[(EMAIL, "onedrive")] = _row(EMAIL, "onedrive")
    return fake


# ---- download ----

def test_download_sets_sanitised_content_disposition(client, users, files):
    files.download_result = ("../CV é.pdf", b"%PDF data", "application/pdf")
    resp = client.get(f"{BASE}/onedrive/files/f1/download", headers=users[EMAIL])
    assert resp.status_code == 200 and resp.data == b"%PDF data"
    assert resp.headers["Content-Type"] == "application/pdf"
    assert resp.headers["Cache-Control"] == "no-store"
    assert resp.headers["Access-Control-Expose-Headers"] == "Content-Disposition"
    cd = resp.headers["Content-Disposition"]
    assert cd == "attachment; filename=\"CV e.pdf\"; filename*=UTF-8''CV%20%C3%A9.pdf"


def test_download_rejects_disallowed_extension(client, users, files):
    files.download_result = ("run.exe", b"MZ", "application/octet-stream")
    resp = client.get(f"{BASE}/onedrive/files/f1/download", headers=users[EMAIL])
    assert resp.status_code == 400 and resp.get_json()["error"] == "unsupported_type"


def test_download_provider_too_large_is_413(client, users, files):
    files.download_error = ProviderError("too_large", "File is larger than 25 MB")
    resp = client.get(f"{BASE}/onedrive/files/f1/download", headers=users[EMAIL])
    assert resp.status_code == 413 and resp.get_json()["error"] == "too_large"


def test_download_invalid_id_is_400_and_never_calls_provider(client, users, files):
    resp = client.get(f"{BASE}/onedrive/files/bad%20id/download", headers=users[EMAIL])
    assert resp.status_code == 400
    assert not any(c[0] == "download" for c in files.calls)


# ---- list ----

def test_list_passes_folder_and_page_token_and_returns_shape(client, users, files):
    resp = client.get(f"{BASE}/onedrive/files?folderId=folder-1&pageToken=abc", headers=users[EMAIL])
    assert resp.status_code == 200
    body = resp.get_json()
    assert files.calls[-1] == ("list", "folder-1", "abc")
    assert body["folderId"] == "root" and body["folderName"] == "OneDrive" and body["parentId"] is None
    assert body["nextPageToken"] is None
    assert body["items"] == [{"id": "f1", "name": "cv.pdf", "isFolder": False, "size": 10,
                              "mimeType": "application/pdf", "modified": None, "webUrl": None}]


def test_list_rejects_bad_folder_id(client, users, files):
    resp = client.get(f"{BASE}/onedrive/files?folderId=..%2F..", headers=users[EMAIL])
    assert resp.status_code == 400
    assert not any(c[0] == "list" for c in files.calls)


def test_google_files_listing_points_to_picker(client, users, env, store):
    resp = client.get(f"{BASE}/google/files", headers=users[EMAIL])
    assert resp.status_code == 400
    assert resp.get_json() == {"error": "use_picker", "message": "Use the Google file picker"}


def test_unknown_provider_is_404(client, users, files):
    resp = client.get(f"{BASE}/dropbox/files", headers=users[EMAIL])
    assert resp.status_code == 404 and resp.get_json()["error"] == "unknown_provider"


# ---- upload ----

def test_upload_success_shape_and_arguments(client, users, files):
    resp = client.post(f"{BASE}/onedrive/upload", headers=users[EMAIL], content_type="multipart/form-data",
                       data={"file": (io.BytesIO(b"docx-bytes"), "out.docx",
                                      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
                             "folderId": "folder-1"})
    assert resp.status_code == 200
    assert resp.get_json() == {"id": "u1", "name": "out.docx", "webUrl": "https://web/u1", "placedInFolder": True}
    assert files.calls[-1] == ("upload", "out.docx", 10,
                               "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "folder-1")


def test_upload_missing_file_is_400(client, users, files):
    resp = client.post(f"{BASE}/onedrive/upload", headers=users[EMAIL], data={"folderId": "x"})
    assert resp.status_code == 400 and resp.get_json()["error"] == "missing_file"


def test_upload_oversize_is_413(client, users, files):
    resp = client.post(f"{BASE}/onedrive/upload", headers=users[EMAIL], content_type="multipart/form-data",
                       data={"file": (io.BytesIO(b"0" * (MAX_BYTES + 1)), "big.pdf")})
    assert resp.status_code == 413 and resp.get_json()["error"] == "too_large"
    assert not any(c[0] == "upload" for c in files.calls)


def test_upload_bad_folder_id_is_400(client, users, files):
    resp = client.post(f"{BASE}/onedrive/upload", headers=users[EMAIL], content_type="multipart/form-data",
                       data={"file": (io.BytesIO(b"x"), "a.pdf"), "folderId": "../x"})
    assert resp.status_code == 400


def test_upload_extension_allow_list(client, users, files):
    resp = client.post(f"{BASE}/onedrive/upload", headers=users[EMAIL], content_type="multipart/form-data",
                       data={"file": (io.BytesIO(b"x"), "a.exe")})
    assert resp.status_code == 400 and resp.get_json()["error"] == "unsupported_type"


# ---- connection state, reconnect and tenant isolation ----

def test_status_error_returns_reconnect_without_calling_provider(client, users, files, store):
    store.accounts[(EMAIL, "onedrive")]["status"] = "error"
    resp = client.get(f"{BASE}/onedrive/files", headers=users[EMAIL])
    assert resp.status_code == 401 and resp.get_json()["error"] == "reconnect"
    assert files.calls == []


def test_invalid_grant_sets_error_and_returns_reconnect(client, users, files, store):
    files.refresh_error = ProviderError("reconnect", "Please reconnect this account")
    resp = client.get(f"{BASE}/onedrive/files", headers=users[EMAIL])
    assert resp.status_code == 401 and resp.get_json()["error"] == "reconnect"
    assert store.accounts[(EMAIL, "onedrive")]["status"] == "error"


def test_tenant_isolation_user_b_cannot_reach_user_a_account(client, users, files):
    assert client.get(f"{BASE}/onedrive/files", headers=users[OTHER]).get_json()["error"] == "not_connected"
    resp = client.get(f"{BASE}/onedrive/files/f1/download", headers=users[OTHER])
    assert resp.status_code == 404 and resp.get_json()["error"] == "not_connected"
    assert client.get(f"{BASE}/onedrive/files", headers=users[EMAIL]).status_code == 200


def test_disabled_flag_is_403(client, users, files, store):
    store.flags[EMAIL] = False
    resp = client.get(f"{BASE}/onedrive/files", headers=users[EMAIL])
    assert resp.status_code == 403 and resp.get_json()["error"] == "disabled"


# ---- Google token route (real GoogleProvider, requests mocked) ----

@pytest.fixture
def google_refresh(monkeypatch):
    """Returns a setter for the next Google token-endpoint response."""
    state = {}

    def fake_post(url, **kwargs):
        return state["resp"]

    monkeypatch.setattr(requests, "post", fake_post)
    return state


def test_google_token_shape_and_no_store(client, users, env, store, google_refresh):
    store.accounts[(EMAIL, "google")] = _row(EMAIL, "google")
    google_refresh["resp"] = FakeResponse(200, {"access_token": "GOOGLE-ACCESS-SENTINEL", "expires_in": 3599})
    resp = client.get(f"{BASE}/google/token", headers=users[EMAIL])
    assert resp.status_code == 200
    body = resp.get_json()
    assert set(body) == {"accessToken", "expiresIn", "clientId", "apiKey", "appId"}
    assert body["accessToken"] == "GOOGLE-ACCESS-SENTINEL"
    assert body["expiresIn"] == 3300
    assert body["clientId"] == env["GOOGLE_CLIENT_ID"]
    assert body["apiKey"] == env["GOOGLE_API_KEY"] and body["appId"] == env["GOOGLE_APP_ID"]
    assert resp.headers["Cache-Control"] == "no-store"
    assert "REFRESH" not in resp.get_data(as_text=True)


def test_google_token_without_picker_config_is_503(client, users, env, store, google_refresh, monkeypatch):
    monkeypatch.delenv("GOOGLE_API_KEY")
    store.accounts[(EMAIL, "google")] = _row(EMAIL, "google")
    resp = client.get(f"{BASE}/google/token", headers=users[EMAIL])
    assert resp.status_code == 503 and resp.get_json()["error"] == "not_configured"


def test_google_token_not_connected_is_404(client, users, env, store):
    resp = client.get(f"{BASE}/google/token", headers=users[EMAIL])
    assert resp.status_code == 404 and resp.get_json()["error"] == "not_connected"


def test_google_token_invalid_grant_is_401_and_marks_error(client, users, env, store, google_refresh):
    store.accounts[(EMAIL, "google")] = _row(EMAIL, "google")
    google_refresh["resp"] = FakeResponse(400, {"error": "invalid_grant"})
    resp = client.get(f"{BASE}/google/token", headers=users[EMAIL])
    assert resp.status_code == 401 and resp.get_json()["error"] == "reconnect"
    assert store.accounts[(EMAIL, "google")]["status"] == "error"
