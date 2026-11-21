import re
from urllib.parse import quote

import pytest

from connectors import crypto, state
from connectors.errors import ConnectorError
from connectors.providers.base import ProviderError


def _state(app, email, provider, origin="https://app.test"):
    with app.app_context():
        return state.make_state(email, provider, origin)


def _cb(client, provider, token=None, **extra):
    query = dict(extra)
    if token is not None:
        query["state"] = token
    qs = "&".join(f"{k}={quote(v, safe='')}" for k, v in query.items())
    return client.get(f"/api/connectors/{provider}/callback?{qs}")


def _msg(resp):
    body = resp.get_data(as_text=True)
    assert resp.mimetype == "text/html"
    assert resp.headers["Cache-Control"] == "no-store"
    assert "script-src 'unsafe-inline'" in resp.headers["Content-Security-Policy"]
    assert '"*"' not in body
    return body


def test_success_stores_encrypted_token_and_posts_ok(app, env, fake_providers, store, client):
    token, nonce = _state(app, "a@x.com", "google")
    resp = _cb(client, "google", token, code="CODE-ABC")
    assert resp.status_code == 200
    body = _msg(resp)
    assert "opus-connector" in body and '"ok": true' in body
    assert body.count("https://app.test") >= 1 and '"https://app.test"' in body
    assert "REFRESH-SENTINEL-ABC" not in body and "ACCESS-SENTINEL-XYZ" not in body
    stored = store.accounts[("a@x.com", "google")]
    assert stored["refresh_token_enc"] != "REFRESH-SENTINEL-ABC"
    assert crypto.decrypt(stored["refresh_token_enc"]) == "REFRESH-SENTINEL-ABC"
    assert fake_providers["google"].exchanged == [
        ("CODE-ABC", "https://api.test/api/connectors/google/callback", None)]


def test_pkce_verifier_is_derived_from_nonce(app, env, fake_providers, store, client):
    token, nonce = _state(app, "a@x.com", "onedrive")
    _cb(client, "onedrive", token, code="CODE")
    with app.app_context():
        expected = state.pkce_verifier(nonce)
    assert fake_providers["onedrive"].exchanged[0][2] == expected


def test_bad_state_targets_first_origin(app, env, fake_providers, store, client):
    body = _msg(_cb(client, "google", "not-a-real-state", code="x"))
    assert '"error": "bad_state"' in body and '"ok": false' in body
    assert '"https://app.test"' in body


def test_state_for_other_provider_is_bad_state(app, env, fake_providers, store, client):
    token, _ = _state(app, "a@x.com", "google")
    body = _msg(_cb(client, "onedrive", token, code="x"))
    assert '"error": "bad_state"' in body
    assert fake_providers["onedrive"].exchanged == []


def test_unknown_provider_renders_popup(app, env, fake_providers, store, client):
    body = _msg(_cb(client, "dropbox", "whatever", code="x"))
    assert '"error": "bad_state"' in body and '"provider": ""' in body


def test_access_denied_does_not_exchange(app, env, fake_providers, store, client):
    token, _ = _state(app, "a@x.com", "google")
    body = _msg(_cb(client, "google", token, error="access_denied"))
    assert '"error": "access_denied"' in body and '"ok": false' in body
    assert fake_providers["google"].exchanged == [] and store.accounts == {}


def test_missing_refresh_token_is_no_refresh_token(app, env, fake_providers, store, client):
    fake_providers["google"].exchange_refresh = None
    token, _ = _state(app, "a@x.com", "google")
    body = _msg(_cb(client, "google", token, code="x"))
    assert '"error": "no_refresh_token"' in body and store.accounts == {}


def test_provider_refresh_message_maps_to_no_refresh_token(app, env, fake_providers, store, client):
    fake_providers["google"].exchange_error = ProviderError("bad_request", "No refresh token returned. Remove")
    token, _ = _state(app, "a@x.com", "google")
    assert '"error": "no_refresh_token"' in _msg(_cb(client, "google", token, code="x"))


def test_origin_in_state_outside_allow_list_falls_back(app, env, fake_providers, store, client):
    token, _ = _state(app, "a@x.com", "google", origin="https://evil.test")
    body = _msg(_cb(client, "google", token, code="x"))
    assert '"https://app.test"' in body and "evil.test" not in body


def test_script_breakout_is_escaped(app, env, fake_providers, store, client, monkeypatch):
    monkeypatch.setenv("FRONTEND_ORIGIN", "https://app.test,https://x.test</script><script>alert(1)")
    token, _ = _state(app, "a@x.com", "google", origin="https://x.test</script><script>alert(1)")
    body = _msg(_cb(client, "google", token, code="x"))
    assert body.count("</script>") == 1
    assert "<\\/script>" in body


def test_no_origin_configured_is_plain_400(app, no_env, fake_providers, client):
    resp = client.get("/api/connectors/google/callback?state=x&code=y")
    assert resp.status_code == 400 and resp.mimetype == "text/plain"


def test_disabled_user_gets_disabled_and_nothing_stored(app, env, fake_providers, store, client):
    store.flags["a@x.com"] = False
    token, _ = _state(app, "a@x.com", "google")
    body = _msg(_cb(client, "google", token, code="CODE-ABC"))
    assert '"error": "disabled"' in body and '"ok": false' in body
    assert store.accounts == {}
