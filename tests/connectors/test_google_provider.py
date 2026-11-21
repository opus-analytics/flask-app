"""Case 8: GoogleProvider with requests mocked (no network), plus the real Google params of the start route."""
import base64
import json
from urllib.parse import parse_qs, urlparse

import pytest
import requests

from connectors.providers.base import MAX_BYTES, ProviderError
from connectors.providers.google import DOCX, GoogleProvider

DRIVE = "https://www.googleapis.com/auth/drive.file"


class FakeResponse:
    def __init__(self, status=200, body=None, headers=None, chunks=()):
        self.status_code = status
        self._body = body
        self.headers = headers or {}
        self._chunks = list(chunks)
        self.read = False
        self.closed = False

    def json(self):
        if self._body is None:
            raise ValueError("no body")
        return self._body

    def iter_content(self, chunk_size=1):
        self.read = True
        yield from self._chunks

    def close(self):
        self.closed = True


def _queue(monkeypatch, verb, responses):
    """Replaces requests.<verb> with a fake that returns queued responses and records each call."""
    calls, pending = [], list(responses)

    def fake(url, **kwargs):
        calls.append((url, kwargs))
        return pending.pop(0)

    monkeypatch.setattr(requests, verb, fake)
    return calls


def _id_token(claims):
    enc = lambda d: base64.urlsafe_b64encode(json.dumps(d).encode()).rstrip(b"=").decode()
    return f"{enc({'alg': 'none'})}.{enc(claims)}.sig"


def _token_body(**overrides):
    body = {"access_token": "GOOGLE-ACCESS", "refresh_token": "GOOGLE-REFRESH", "expires_in": 3599,
            "scope": "openid email " + DRIVE, "id_token": _id_token({"email": "a@x.com"})}
    body.update(overrides)
    return body


def _without(body, key):
    return {k: v for k, v in body.items() if k != key}


# ---- exchange_code / refresh / revoke ----

def test_exchange_reads_email_from_id_token(env, monkeypatch):
    _queue(monkeypatch, "post", [FakeResponse(200, _token_body())])
    result = GoogleProvider().exchange_code("CODE", "https://api.test/cb")
    assert result.account_label == "a@x.com"
    assert result.refresh_token == "GOOGLE-REFRESH"
    assert result.scopes == "openid email " + DRIVE


def test_exchange_rejects_missing_refresh_token(env, monkeypatch):
    _queue(monkeypatch, "post", [FakeResponse(200, _without(_token_body(), "refresh_token"))])
    with pytest.raises(ProviderError) as err:
        GoogleProvider().exchange_code("CODE", "https://api.test/cb")
    assert err.value.code == "bad_request"
    assert "refresh token" in err.value.message.lower()


def test_exchange_rejects_missing_drive_scope(env, monkeypatch):
    _queue(monkeypatch, "post", [FakeResponse(200, _token_body(scope="openid email"))])
    with pytest.raises(ProviderError) as err:
        GoogleProvider().exchange_code("CODE", "https://api.test/cb")
    assert err.value.code == "bad_request" and err.value.message == "Drive access was not granted"


def test_refresh_invalid_grant_means_reconnect(env, monkeypatch):
    _queue(monkeypatch, "post", [FakeResponse(400, {"error": "invalid_grant"})])
    with pytest.raises(ProviderError) as err:
        GoogleProvider().refresh("GOOGLE-REFRESH")
    assert err.value.code == "reconnect"


def test_refresh_returns_access_without_rotation(env, monkeypatch):
    _queue(monkeypatch, "post", [FakeResponse(200, {"access_token": "NEW-ACCESS", "expires_in": 3500})])
    result = GoogleProvider().refresh("GOOGLE-REFRESH")
    assert result.access_token == "NEW-ACCESS" and result.expires_in == 3500
    assert result.new_refresh_token is None


def test_network_error_never_echoes_exception_text(env, monkeypatch):
    def boom(url, **kwargs):
        raise requests.ConnectionError("https://oauth2.test/?token=SECRET-TOKEN-123")
    monkeypatch.setattr(requests, "post", boom)
    with pytest.raises(ProviderError) as err:
        GoogleProvider().refresh("GOOGLE-REFRESH")
    assert err.value.code == "upstream"
    assert "SECRET" not in err.value.message


def test_revoke_swallows_errors(env, monkeypatch):
    def boom(url, **kwargs):
        raise requests.Timeout("slow")
    monkeypatch.setattr(requests, "post", boom)
    assert GoogleProvider().revoke("GOOGLE-REFRESH") is None


def test_list_files_is_bad_request(env):
    with pytest.raises(ProviderError) as err:
        GoogleProvider().list_files("ACC", None, None)
    assert err.value.code == "bad_request"


# ---- download ----

def test_download_binary_uses_alt_media(env, monkeypatch):
    payload = b"%PDF-1.4 hi"
    calls = _queue(monkeypatch, "get", [
        FakeResponse(200, {"id": "f1", "name": "cv.pdf", "mimeType": "application/pdf", "size": str(len(payload))}),
        FakeResponse(200, chunks=[payload]),
    ])
    assert GoogleProvider().download("ACC", "f1") == ("cv.pdf", payload, "application/pdf")
    assert calls[0][1]["headers"]["Authorization"] == "Bearer ACC"
    assert calls[1][0].endswith("/files/f1")
    assert calls[1][1]["params"]["alt"] == "media" and calls[1][1]["stream"] is True


def test_download_google_doc_is_exported_as_docx(env, monkeypatch):
    calls = _queue(monkeypatch, "get", [
        FakeResponse(200, {"id": "d1", "name": "Resume", "mimeType": "application/vnd.google-apps.document"}),
        FakeResponse(200, chunks=[b"DOCX-BYTES"]),
    ])
    assert GoogleProvider().download("ACC", "d1") == ("Resume.docx", b"DOCX-BYTES", DOCX)
    assert calls[1][0].endswith("/files/d1/export")
    assert calls[1][1]["params"]["mimeType"] == DOCX


def test_download_google_sheet_is_unsupported(env, monkeypatch):
    calls = _queue(monkeypatch, "get", [
        FakeResponse(200, {"id": "s1", "name": "Budget", "mimeType": "application/vnd.google-apps.spreadsheet"}),
    ])
    with pytest.raises(ProviderError) as err:
        GoogleProvider().download("ACC", "s1")
    assert err.value.code == "bad_request" and len(calls) == 1


def test_download_size_over_cap_fails_before_body_read(env, monkeypatch):
    calls = _queue(monkeypatch, "get", [
        FakeResponse(200, {"id": "f1", "name": "big.pdf", "mimeType": "application/pdf", "size": str(MAX_BYTES + 1)}),
    ])
    with pytest.raises(ProviderError) as err:
        GoogleProvider().download("ACC", "f1")
    assert err.value.code == "too_large" and len(calls) == 1


def test_download_content_length_over_cap_fails_before_body_read(env, monkeypatch):
    content = FakeResponse(200, headers={"Content-Length": str(MAX_BYTES + 1)}, chunks=[b"x"])
    _queue(monkeypatch, "get", [
        FakeResponse(200, {"id": "f1", "name": "a.pdf", "mimeType": "application/pdf"}),
        content,
    ])
    with pytest.raises(ProviderError) as err:
        GoogleProvider().download("ACC", "f1")
    assert err.value.code == "too_large"
    assert content.read is False and content.closed is True


def test_download_enforces_cap_while_reading_chunks(env, monkeypatch):
    half = b"a" * (MAX_BYTES // 2 + 1)
    content = FakeResponse(200, chunks=[half, half])  # no declared size, so the cap must trip mid-stream
    _queue(monkeypatch, "get", [FakeResponse(200, {"id": "f1", "name": "a.pdf", "mimeType": "application/pdf"}),
                                content])
    with pytest.raises(ProviderError) as err:
        GoogleProvider().download("ACC", "f1")
    assert err.value.code == "too_large" and content.closed is True


def test_download_not_granted_404_gives_picker_message(env, monkeypatch):
    _queue(monkeypatch, "get", [FakeResponse(404, {"error": {}})])
    with pytest.raises(ProviderError) as err:
        GoogleProvider().download("ACC", "f1")
    assert err.value.code == "not_found"
    assert "Pick it again" in err.value.message


# ---- upload ----

def _multipart_parts(call):
    boundary = call["headers"]["Content-Type"].split("boundary=", 1)[1].encode()
    raw = call["data"].split(b"--" + boundary)
    parts = []
    for chunk in raw[1:-1]:
        head, body = chunk.strip(b"\r\n").split(b"\r\n\r\n", 1)
        parts.append((head, body))
    return parts


def test_upload_small_is_multipart_with_metadata_first(env, monkeypatch):
    calls = _queue(monkeypatch, "post", [
        FakeResponse(200, {"id": "f1", "name": "cv.pdf", "webViewLink": "https://drive/f1"}),
    ])
    result = GoogleProvider().upload("ACC", "cv.pdf", b"%PDF-data", "application/pdf", "FOLDER1")
    assert (result.id, result.name, result.web_url, result.placed_in_folder) == ("f1", "cv.pdf", "https://drive/f1", True)
    call = calls[0][1]
    assert "uploadType=multipart" in calls[0][0]
    assert call["headers"]["Content-Type"].startswith("multipart/related; boundary=")
    (meta_head, meta_body), (media_head, media_body) = _multipart_parts(call)
    assert meta_head == b"Content-Type: application/json; charset=UTF-8"
    meta = json.loads(meta_body)
    assert meta == {"name": "cv.pdf", "mimeType": "application/pdf", "parents": ["FOLDER1"]}
    assert media_head == b"Content-Type: application/pdf"
    assert media_body == b"%PDF-data"


def test_upload_large_is_resumable_then_put(env, monkeypatch):
    data = b"x" * (5 * 1024 * 1024 + 1)
    location = "https://www.googleapis.com/upload/drive/v3/files?upload_id=abc"
    post_calls = _queue(monkeypatch, "post", [FakeResponse(200, headers={"Location": location})])
    put_calls = _queue(monkeypatch, "put", [FakeResponse(200, {"id": "f2", "name": "big.pdf"})])
    result = GoogleProvider().upload("ACC", "big.pdf", data, "application/pdf", None)
    assert result.id == "f2" and result.placed_in_folder is True
    assert "uploadType=resumable" in post_calls[0][0]
    assert post_calls[0][1]["headers"]["X-Upload-Content-Type"] == "application/pdf"
    assert json.loads(post_calls[0][1]["data"]) == {"name": "big.pdf", "mimeType": "application/pdf"}
    assert put_calls[0][0] == location and put_calls[0][1]["data"] == data


def test_upload_resumable_rejects_foreign_location(env, monkeypatch):
    _queue(monkeypatch, "post", [FakeResponse(200, headers={"Location": "https://evil.test/up"})])
    with pytest.raises(ProviderError) as err:
        GoogleProvider().upload("ACC", "big.pdf", b"x" * (5 * 1024 * 1024 + 1), "application/pdf", None)
    assert err.value.code == "upstream"


def test_upload_folder_404_retries_without_parents(env, monkeypatch):
    calls = _queue(monkeypatch, "post", [
        FakeResponse(404),
        FakeResponse(200, {"id": "f3", "name": "cv.pdf", "webViewLink": "https://drive/f3"}),
    ])
    result = GoogleProvider().upload("ACC", "cv.pdf", b"%PDF", "application/pdf", "GONE")
    assert result.placed_in_folder is False and result.id == "f3"
    first, second = (_multipart_parts(c[1])[0][1] for c in calls)
    assert json.loads(first)["parents"] == ["GONE"]
    assert "parents" not in json.loads(second)


def test_upload_without_folder_404_is_not_found(env, monkeypatch):
    _queue(monkeypatch, "post", [FakeResponse(404)])
    with pytest.raises(ProviderError) as err:
        GoogleProvider().upload("ACC", "cv.pdf", b"%PDF", "application/pdf", None)
    assert err.value.code == "not_found"


def test_upload_over_cap_is_too_large_without_network(env, monkeypatch):
    calls = _queue(monkeypatch, "post", [])
    with pytest.raises(ProviderError) as err:
        GoogleProvider().upload("ACC", "a.pdf", b"x" * (MAX_BYTES + 1), "application/pdf", None)
    assert err.value.code == "too_large" and calls == []


# ---- real provider through the start route (replaces the skipped T1 check for Google) ----

def test_start_route_uses_real_google_params(env, store, client, users):
    from connectors.providers.base import PROVIDERS
    assert isinstance(PROVIDERS["google"], GoogleProvider)
    resp = client.post("/api/connectors/google/start", json={"origin": "https://app.test"},
                       headers=users["a@x.com"])
    assert resp.status_code == 200
    query = parse_qs(urlparse(resp.get_json()["authUrl"]).query)
    assert query["access_type"] == ["offline"] and query["prompt"] == ["consent"]
    assert query["scope"] == ["openid email " + DRIVE]
    assert query["redirect_uri"] == ["https://api.test/api/connectors/google/callback"]
    assert "code_challenge" not in query
