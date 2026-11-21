import logging
from urllib.parse import quote

from connectors import crypto, state
from connectors.errors import ConnectorError
from connectors.providers.base import ProviderError

SENTINELS = ("REFRESH-SENTINEL-ABC", "ACCESS-SENTINEL-XYZ", "CODE-SENTINEL-123", "google-secret-test")


def _assert_clean(caplog, extra=()):
    text = caplog.text
    for sentinel in (*SENTINELS, *extra):
        assert sentinel not in text


def test_callback_and_disconnect_never_log_secrets(app, env, fake_providers, store, client, caplog, users):
    caplog.set_level(logging.DEBUG)
    with app.app_context():
        token, _ = state.make_state("a@x.com", "google", "https://app.test")
    client.get(f"/api/connectors/google/callback?code=CODE-SENTINEL-123&state={quote(token, safe='')}")
    _assert_clean(caplog, extra=(token,))

    store.accounts[("a@x.com", "google")] = {"account_label": "a", "status": "active",
                                             "refresh_token_enc": crypto.encrypt("REFRESH-SENTINEL-ABC")}

    def revoke_raises(refresh_token):
        raise RuntimeError(refresh_token)  # message carries the secret; the route must not log it

    fake_providers["google"].revoke = revoke_raises
    assert client.delete("/api/connectors/google", headers=users["a@x.com"]).status_code == 200
    _assert_clean(caplog)


def test_callback_provider_error_logs_only_code(app, env, fake_providers, store, client, caplog):
    caplog.set_level(logging.DEBUG)
    fake_providers["google"].exchange_error = ProviderError("upstream", "CODE-SENTINEL-123 leaked")
    with app.app_context():
        token, _ = state.make_state("a@x.com", "google", "https://app.test")
    client.get(f"/api/connectors/google/callback?code=CODE-SENTINEL-123&state={quote(token, safe='')}")
    _assert_clean(caplog)


def test_reconnect_flow_logs_no_tokens(env, fake_providers, store, caplog):
    from connectors import tokens
    caplog.set_level(logging.DEBUG)
    store.accounts[("a@x.com", "google")] = {"account_label": "a", "status": "active",
                                             "refresh_token_enc": crypto.encrypt("REFRESH-SENTINEL-ABC")}
    fake_providers["google"].refresh_error = ProviderError("reconnect", "REFRESH-SENTINEL-ABC invalid_grant")
    try:
        tokens.get_access_token("a@x.com", "google")
    except ConnectorError as err:
        assert err.code == "reconnect"
    _assert_clean(caplog)
