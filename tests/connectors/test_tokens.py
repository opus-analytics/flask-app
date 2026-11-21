import pytest

from connectors import crypto, repo, tokens
from connectors.errors import ConnectorError
from connectors.providers.base import AccessResult, ProviderError


@pytest.fixture
def account(store, env):
    """A connected, active google account whose stored refresh token is RAW-1."""
    store.accounts[("a@x.com", "google")] = {"user_email": "a@x.com", "provider": "google",
                                             "account_label": "a@x.com",
                                             "refresh_token_enc": crypto.encrypt("RAW-1"),
                                             "scopes": "s", "status": "active"}
    return store


def test_rotated_token_is_persisted_encrypted(account, fake_providers, monkeypatch):
    calls = []
    original = repo.update_refresh_token
    monkeypatch.setattr(repo, "update_refresh_token",
                        lambda e, p, enc: (calls.append(enc), original(e, p, enc)))
    fake_providers["google"].new_refresh = "RAW-2"
    tokens.get_access_result("a@x.com", "google")
    assert len(calls) == 1
    assert calls[0] != "RAW-2"
    assert crypto.decrypt(calls[0]) == "RAW-2"


def test_reconnect_race_retries_once_with_stored_token(account, fake_providers, monkeypatch):
    provider = fake_providers["google"]
    seen = []

    def refresh(token):
        seen.append(token)
        if token == "RAW-1":  # another request rotated the token meanwhile
            account.accounts[("a@x.com", "google")]["refresh_token_enc"] = crypto.encrypt("RAW-2")
            raise ProviderError("reconnect", "invalid_grant")
        return AccessResult(access_token="ACCESS-OK", expires_in=3600, new_refresh_token=None)

    monkeypatch.setattr(provider, "refresh", refresh)
    _, result = tokens.get_access_result("a@x.com", "google")
    assert result.access_token == "ACCESS-OK"
    assert seen == ["RAW-1", "RAW-2"]
    assert account.accounts[("a@x.com", "google")]["status"] == "active"


def test_reconnect_with_unchanged_token_marks_error(account, fake_providers):
    fake_providers["google"].refresh_error = ProviderError("reconnect", "invalid_grant")
    with pytest.raises(ConnectorError) as exc:
        tokens.get_access_result("a@x.com", "google")
    assert exc.value.status == 401 and exc.value.code == "reconnect"
    assert account.accounts[("a@x.com", "google")]["status"] == "error"
