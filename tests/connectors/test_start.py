from urllib.parse import parse_qs, urlparse

from connectors import state


def _start(client, headers, provider, origin=None):
    body = {"origin": origin} if origin is not None else {}
    return client.post(f"/api/connectors/{provider}/start", json=body, headers=headers)


def _params(auth_url):
    return {k: v[0] for k, v in parse_qs(urlparse(auth_url).query).items()}


def test_start_contains_state_redirect_and_pkce_only_for_pkce_provider(
        app, env, fake_providers, store, client, users):
    resp = _start(client, users["a@x.com"], "onedrive", "https://app.test")
    assert resp.status_code == 200
    params = _params(resp.get_json()["authUrl"])
    assert params["client_id"] == "fake-client"
    assert params["redirect_uri"] == "https://api.test/api/connectors/onedrive/callback"
    assert params["code_challenge_method"] == "S256" and params["code_challenge"]
    with app.app_context():
        assert state.read_state(params["state"], "onedrive")["o"] == "https://app.test"

    resp = _start(client, users["a@x.com"], "google", "https://app.test")
    assert "code_challenge" not in _params(resp.get_json()["authUrl"])


def test_origin_fallbacks(app, env, fake_providers, store, client, users):
    for given, expected in [
        ("https://evil.test", "https://app.test"),         # not in allow-list -> first origin
        (None, "https://app.test"),                        # no origin sent -> first origin
        ("http://localhost:5173/", "http://localhost:5173"),  # allowed, trailing slash stripped
    ]:
        resp = _start(client, users["a@x.com"], "google", given)
        params = _params(resp.get_json()["authUrl"])
        with app.app_context():
            assert state.read_state(params["state"], "google")["o"] == expected


def test_real_provider_params_when_present(env, store, client, users):
    from connectors.providers.base import PROVIDERS
    if "google" not in PROVIDERS or "onedrive" not in PROVIDERS:
        import pytest
        pytest.skip("google/onedrive provider modules not present yet")
    params = _params(_start(client, users["a@x.com"], "google").get_json()["authUrl"])
    assert params["access_type"] == "offline" and params["prompt"] == "consent"
    params = _params(_start(client, users["a@x.com"], "onedrive").get_json()["authUrl"])
    assert params["code_challenge_method"] == "S256"
    assert params["scope"] == "Files.ReadWrite offline_access User.Read"


def test_no_jwt_is_401(env, fake_providers, client):
    assert client.post("/api/connectors/google/start", json={}).status_code == 401


def test_flag_false_is_403(env, fake_providers, store, client, users):
    store.flags["a@x.com"] = False
    resp = _start(client, users["a@x.com"], "google")
    assert resp.status_code == 403 and resp.get_json()["error"] == "disabled"


def test_unknown_provider_is_404(env, fake_providers, store, client, users):
    resp = _start(client, users["a@x.com"], "dropbox")
    assert resp.status_code == 404 and resp.get_json()["error"] == "unknown_provider"


def test_not_configured_is_503(no_env, fake_providers, store, client, users):
    resp = _start(client, users["a@x.com"], "google")
    assert resp.status_code == 503 and resp.get_json()["error"] == "not_configured"
