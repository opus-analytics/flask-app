"""OneDrive provider (H case 9). Every HTTP call is mocked: no network, no DB."""
from types import SimpleNamespace
from unittest.mock import MagicMock, patch
from urllib.parse import parse_qs

import pytest
import requests

from connectors.providers.base import MAX_BYTES, ProviderError, UploadResult

GRAPH = "https://graph.microsoft.com/v1.0"
TOKEN_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/token"
REDIRECT = "https://api.test/api/connectors/onedrive/callback"
SCOPES = "Files.ReadWrite offline_access User.Read"
LIST_SELECT = "id,name,size,folder,file,lastModifiedDateTime,webUrl,parentReference"
DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"


def resp(status=200, body=None, headers=None, chunks=None):
    r = MagicMock()
    r.status_code = status
    r.json.return_value = {} if body is None else body
    r.headers = {} if headers is None else headers
    r.iter_content.return_value = [] if chunks is None else chunks
    return r


@pytest.fixture
def provider(env):
    from connectors.providers.onedrive import OneDriveProvider
    return OneDriveProvider()


@pytest.fixture
def http():
    with patch("connectors.providers.onedrive.requests.get") as get, \
            patch("connectors.providers.onedrive.requests.post") as post, \
            patch("connectors.providers.onedrive.requests.put") as put:
        yield SimpleNamespace(get=get, post=post, put=put)


def _raises(code, fn, *args, **kwargs):
    with pytest.raises(ProviderError) as exc:
        fn(*args, **kwargs)
    assert exc.value.code == code
    return exc.value


def test_identity(provider):
    assert provider.id == "onedrive"
    assert provider.uses_pkce is True
    assert provider.scopes == SCOPES


def test_is_configured_needs_ms_credentials(provider, monkeypatch):
    assert provider.is_configured() is True
    monkeypatch.delenv("MS_CLIENT_SECRET")
    assert provider.is_configured() is False


def test_auth_url_params(provider):
    url = provider.auth_url("STATE-1", REDIRECT, "CHAL-1")
    base, _, query = url.partition("?")
    assert base == "https://login.microsoftonline.com/common/oauth2/v2.0/authorize"
    params = {k: v[0] for k, v in parse_qs(query).items()}
    assert params == {"client_id": "ms-client-id-test", "response_type": "code", "redirect_uri": REDIRECT,
                      "response_mode": "query", "scope": SCOPES, "state": "STATE-1",
                      "prompt": "select_account", "code_challenge": "CHAL-1", "code_challenge_method": "S256"}


def test_auth_url_requires_challenge(provider):
    _raises("bad_request", provider.auth_url, "STATE-1", REDIRECT, None)


def test_exchange_code_builds_request_and_label(provider, http):
    http.post.return_value = resp(body={"access_token": "AT-1", "refresh_token": "RT-1", "expires_in": 3599,
                                        "scope": SCOPES})
    http.get.return_value = resp(body={"mail": "m@x.com", "userPrincipalName": "u@x.com"})
    result = provider.exchange_code("CODE-1", REDIRECT, "VERIFIER-1")

    assert http.post.call_args.args[0] == TOKEN_URL
    data = http.post.call_args.kwargs["data"]
    assert data["grant_type"] == "authorization_code" and data["code"] == "CODE-1"
    assert data["code_verifier"] == "VERIFIER-1" and data["scope"] == SCOPES
    assert data["redirect_uri"] == REDIRECT
    assert http.post.call_args.kwargs["timeout"] == (5, 30)
    assert http.get.call_args.args[0] == GRAPH + "/me?$select=displayName,mail,userPrincipalName"
    assert http.get.call_args.kwargs["headers"]["Authorization"] == "Bearer AT-1"
    assert result.access_token == "AT-1" and result.refresh_token == "RT-1"
    assert result.expires_in == 3599 and result.account_label == "m@x.com" and result.scopes == SCOPES


@pytest.mark.parametrize("me, label", [
    ({"mail": "m@x.com", "userPrincipalName": "u@x.com", "displayName": "D"}, "m@x.com"),
    ({"mail": None, "userPrincipalName": "u@x.com", "displayName": "D"}, "u@x.com"),
    ({"mail": "", "userPrincipalName": None, "displayName": "D"}, "D"),
    ({"mail": None, "userPrincipalName": None, "displayName": None}, "OneDrive"),
])
def test_label_fallback_order(provider, http, me, label):
    http.post.return_value = resp(body={"access_token": "AT", "refresh_token": "RT"})
    http.get.return_value = resp(body=me)
    assert provider.exchange_code("C", REDIRECT, "V").account_label == label


def test_exchange_without_refresh_token_is_rejected(provider, http):
    http.post.return_value = resp(body={"access_token": "AT"})
    err = _raises("bad_request", provider.exchange_code, "C", REDIRECT, "V")
    assert "offline_access" in err.message
    http.get.assert_not_called()


def test_exchange_requires_verifier(provider, http):
    _raises("bad_request", provider.exchange_code, "C", REDIRECT, None)
    http.post.assert_not_called()


def test_refresh_returns_rotated_refresh_token(provider, http):
    http.post.return_value = resp(body={"access_token": "AT-2", "refresh_token": "RT-NEW", "expires_in": 3600})
    result = provider.refresh("RT-OLD")
    data = http.post.call_args.kwargs["data"]
    assert data["grant_type"] == "refresh_token" and data["refresh_token"] == "RT-OLD"
    assert http.post.call_args.kwargs["timeout"] == (5, 30)
    assert result.access_token == "AT-2" and result.expires_in == 3600 and result.new_refresh_token == "RT-NEW"


def test_refresh_without_rotation_returns_none(provider, http):
    http.post.return_value = resp(body={"access_token": "AT-2", "expires_in": 3600})
    assert provider.refresh("RT-OLD").new_refresh_token is None


@pytest.mark.parametrize("status, error, code", [
    (400, "invalid_grant", "reconnect"),
    (400, "interaction_required", "reconnect"),
    (401, "", "reconnect"),
    (400, "invalid_request", "bad_request"),
    (500, "server_error", "upstream"),
    (503, "", "upstream"),
])
def test_token_endpoint_error_mapping(provider, http, status, error, code):
    http.post.return_value = resp(status, body={"error": error, "error_description": "SECRET-DESC-123"})
    err = _raises(code, provider.refresh, "RT-OLD")
    assert "SECRET" not in err.message


@pytest.mark.parametrize("exc", [requests.Timeout("SECRET-A"), requests.ConnectionError("SECRET-B")])
def test_token_endpoint_network_error_is_upstream(provider, http, exc):
    http.post.side_effect = exc
    err = _raises("upstream", provider.refresh, "RT-OLD")
    assert "SECRET" not in err.message


def test_revoke_is_a_noop(provider, http):
    provider.revoke("RT-OLD")
    http.post.assert_not_called()
    http.get.assert_not_called()


LIST_ROOT = GRAPH + "/me/drive/root/children"


def test_list_root_url_and_params(provider, http):
    http.get.return_value = resp(body={"value": []})
    page = provider.list_files("AT", None, None)
    assert http.get.call_args.args[0] == LIST_ROOT
    assert http.get.call_args.kwargs["params"] == {"$select": LIST_SELECT, "$top": "100"}
    assert http.get.call_args.kwargs["timeout"] == (5, 30)
    assert page.folder_id == "root" and page.folder_name == "OneDrive" and page.parent_id is None
    assert http.get.call_count == 1


def test_list_folder_url_and_context(provider, http):
    http.get.side_effect = [resp(body={"value": []}),
                            resp(body={"name": "Resumes", "parentReference": {"id": "ROOT-ID"}})]
    page = provider.list_files("AT", "FOLDER.1-a", None)
    assert http.get.call_args_list[0].args[0] == GRAPH + "/me/drive/items/FOLDER.1-a/children"
    ctx = http.get.call_args_list[1]
    assert ctx.args[0] == GRAPH + "/me/drive/items/FOLDER.1-a"
    assert ctx.kwargs["params"] == {"$select": "id,name,parentReference"}
    assert page.folder_id == "FOLDER.1-a" and page.folder_name == "Resumes" and page.parent_id == "ROOT-ID"


def test_list_explicit_root_id_uses_root_url(provider, http):
    http.get.return_value = resp(body={"value": []})
    provider.list_files("AT", "root", None)
    assert http.get.call_args.args[0] == LIST_ROOT


def test_list_rejects_bad_folder_id(provider, http):
    _raises("bad_request", provider.list_files, "AT", "a/../b", None)
    http.get.assert_not_called()


def test_list_maps_facets_and_sorts_folders_first(provider, http):
    http.get.return_value = resp(body={"value": [
        {"id": "f1", "name": "b.pdf", "size": 10, "file": {"mimeType": "application/pdf"},
         "lastModifiedDateTime": "2026-01-01T00:00:00Z", "webUrl": "https://x/b"},
        {"id": "d1", "name": "Zeta", "folder": {"childCount": 2}},
        {"id": "d2", "name": "alpha", "folder": {"childCount": 0}},
        {"id": "f2", "name": "A.docx", "file": {"mimeType": DOCX_MIME}},
    ]})
    items = provider.list_files("AT", None, None).items
    assert [i.name for i in items] == ["alpha", "Zeta", "A.docx", "b.pdf"]
    folder, f1 = items[0], items[3]
    assert folder.is_folder is True and folder.mime_type is None
    assert f1.is_folder is False and f1.mime_type == "application/pdf" and f1.size == 10
    assert f1.modified == "2026-01-01T00:00:00Z" and f1.web_url == "https://x/b"


def test_list_passes_next_link_through(provider, http):
    next_link = LIST_ROOT + "?$skiptoken=abc"
    http.get.return_value = resp(body={"value": [], "@odata.nextLink": next_link})
    assert provider.list_files("AT", None, None).next_page_token == next_link

    http.get.reset_mock()
    http.get.return_value = resp(body={"value": []})
    provider.list_files("AT", None, next_link)
    assert http.get.call_args.args[0] == next_link
    assert http.get.call_args.kwargs["params"] is None
    assert http.get.call_count == 1  # no folder-context lookup on later pages


@pytest.mark.parametrize("token", [
    "https://evil.test/x",
    "https://graph.microsoft.com.evil.test/v1.0/me",
    "https://graph.microsoft.com/v1.0/users/x",
    "http://graph.microsoft.com/v1.0/me",
    "javascript:alert(1)",
])
def test_next_link_outside_graph_is_rejected(provider, http, token):
    _raises("bad_request", provider.list_files, "AT", None, token)
    http.get.assert_not_called()


@pytest.mark.parametrize("status, code", [
    (401, "reconnect"), (403, "forbidden"), (404, "not_found"), (400, "bad_request"),
    (429, "upstream"), (500, "upstream"), (503, "upstream"),
])
def test_graph_status_mapping(provider, http, status, code):
    http.get.return_value = resp(status, body={"error": {"message": "Bearer SECRET-TOKEN-9"}})
    err = _raises(code, provider.list_files, "AT", None, None)
    assert "SECRET" not in err.message


@pytest.mark.parametrize("exc", [requests.Timeout("SECRET-A"), requests.ConnectionError("SECRET-B")])
def test_graph_network_error_is_upstream(provider, http, exc):
    http.get.side_effect = exc
    err = _raises("upstream", provider.list_files, "AT", None, None)
    assert "SECRET" not in err.message


def test_graph_invalid_json_is_upstream(provider, http):
    bad = resp(200)
    bad.json.side_effect = ValueError("not json")
    http.get.return_value = bad
    _raises("upstream", provider.list_files, "AT", None, None)


ITEM = GRAPH + "/me/drive/items/FILE-1"
META = {"id": "FILE-1", "name": "CV.pdf", "size": 123, "file": {"mimeType": "application/pdf"}}


def test_download_follows_content_with_bearer(provider, http):
    http.get.side_effect = [resp(body=META),
                            resp(chunks=[b"%PDF-", b"data"], headers={"Content-Length": "9"})]
    name, data, mime = provider.download("AT", "FILE-1")
    assert (name, data, mime) == ("CV.pdf", b"%PDF-data", "application/pdf")
    first, second = http.get.call_args_list
    assert first.args[0] == ITEM
    assert first.kwargs["params"] == {"$select": "id,name,size,file,@microsoft.graph.downloadUrl"}
    assert second.args[0] == ITEM + "/content"
    assert second.kwargs["headers"]["Authorization"] == "Bearer AT"
    assert second.kwargs["allow_redirects"] is True and second.kwargs["stream"] is True
    assert second.kwargs["timeout"] == (5, 30)


def test_download_default_mimetype(provider, http):
    meta = {"id": "FILE-1", "name": "x", "file": {}}
    http.get.side_effect = [resp(body=meta), resp(chunks=[b"ab"])]
    assert provider.download("AT", "FILE-1")[2] == "application/octet-stream"


def test_download_rejects_folder(provider, http):
    http.get.return_value = resp(body={"id": "FILE-1", "name": "Docs", "folder": {"childCount": 1}})
    _raises("bad_request", provider.download, "AT", "FILE-1")
    assert http.get.call_count == 1


def test_download_rejects_bad_id(provider, http):
    _raises("bad_request", provider.download, "AT", "../x")
    http.get.assert_not_called()


def test_download_rejects_declared_size_over_cap(provider, http):
    http.get.return_value = resp(body={**META, "size": MAX_BYTES + 1})
    _raises("too_large", provider.download, "AT", "FILE-1")
    assert http.get.call_count == 1


def test_download_rejects_content_length_over_cap(provider, http):
    http.get.side_effect = [resp(body={"id": "FILE-1", "name": "x", "file": {}}),
                            resp(chunks=[b"ab"], headers={"Content-Length": str(MAX_BYTES + 1)})]
    _raises("too_large", provider.download, "AT", "FILE-1")


def test_download_enforces_cap_while_streaming(provider, http):
    meta = {"id": "FILE-1", "name": "x", "file": {}}  # no size: only the stream can reveal it
    http.get.side_effect = [resp(body=meta),
                            resp(chunks=[b"a" * (MAX_BYTES - 10), b"b" * 20])]
    _raises("too_large", provider.download, "AT", "FILE-1")


UP_BASE = GRAPH + "/me/drive/root:/"


def test_upload_root_url_quoted_and_rename(provider, http):
    http.put.return_value = resp(201, body={"id": "NEW-1", "name": "CV final #1.docx",
                                            "webUrl": "https://onedrive.test/x"})
    result = provider.upload("AT", "CV final #1.docx", b"DOCX", DOCX_MIME, None)
    assert http.put.call_args.args[0] == \
        UP_BASE + "CV%20final%20%231.docx:/content?@microsoft.graph.conflictBehavior=rename"
    kwargs = http.put.call_args.kwargs
    assert kwargs["data"] == b"DOCX"
    assert kwargs["headers"]["Authorization"] == "Bearer AT"
    assert kwargs["headers"]["Content-Type"] == DOCX_MIME
    assert kwargs["timeout"] == (5, 30)
    assert result == UploadResult(id="NEW-1", name="CV final #1.docx", web_url="https://onedrive.test/x")


@pytest.mark.parametrize("folder_id", [None, "", "root"])
def test_upload_root_variants(provider, http, folder_id):
    http.put.return_value = resp(201, body={"id": "N", "name": "a.pdf"})
    provider.upload("AT", "a.pdf", b"x", "application/pdf", folder_id)
    assert http.put.call_args.args[0].startswith(UP_BASE + "a.pdf:/content")


def test_upload_into_folder_uses_items_path(provider, http):
    http.put.return_value = resp(201, body={"id": "N", "name": "a.pdf"})
    provider.upload("AT", "a.pdf", b"x", "", "FOLDER-9")
    assert http.put.call_args.args[0] == \
        GRAPH + "/me/drive/items/FOLDER-9:/a.pdf:/content?@microsoft.graph.conflictBehavior=rename"
    assert http.put.call_args.kwargs["headers"]["Content-Type"] == "application/octet-stream"


def test_upload_rejects_bad_folder_id(provider, http):
    _raises("bad_request", provider.upload, "AT", "a.pdf", b"x", "application/pdf", "x/y")
    http.put.assert_not_called()


def test_upload_over_cap_is_too_large(provider, http):
    _raises("too_large", provider.upload, "AT", "a.pdf", b"x" * (MAX_BYTES + 1), "application/pdf", None)
    http.put.assert_not_called()


def test_upload_response_without_id_is_upstream(provider, http):
    http.put.return_value = resp(201, body={})
    _raises("upstream", provider.upload, "AT", "a.pdf", b"x", "application/pdf", None)


def test_upload_put_status_mapping(provider, http):
    http.put.return_value = resp(404, body={"error": {"message": "SECRET-X"}})
    err = _raises("not_found", provider.upload, "AT", "a.pdf", b"x", "application/pdf", None)
    assert "SECRET" not in err.message
