"""Connector test harness. No DB and no network: repo functions, provider HTTP and JWT checks are all faked."""
from urllib.parse import urlencode

import pytest
from cryptography.fernet import Fernet
from flask import Flask

ENV_KEYS = ("GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_API_KEY", "GOOGLE_APP_ID",
            "MS_CLIENT_ID", "MS_CLIENT_SECRET", "CONNECTOR_ENC_KEY", "PUBLIC_API_BASE", "FRONTEND_ORIGIN")
TOKENS = {"tok-a": "a@x.com", "tok-b": "b@x.com"}


@pytest.fixture
def env(monkeypatch):
    values = {
        "GOOGLE_CLIENT_ID": "google-client-id.apps.test", "GOOGLE_CLIENT_SECRET": "google-secret-test",
        "GOOGLE_API_KEY": "google-api-key-test", "GOOGLE_APP_ID": "123456789",
        "MS_CLIENT_ID": "ms-client-id-test", "MS_CLIENT_SECRET": "ms-secret-test",
        "CONNECTOR_ENC_KEY": Fernet.generate_key().decode(),
        "PUBLIC_API_BASE": "https://api.test",
        "FRONTEND_ORIGIN": "https://app.test, http://localhost:5173/",
    }
    for key, value in values.items():
        monkeypatch.setenv(key, value)
    return values


@pytest.fixture
def no_env(monkeypatch):
    for key in ENV_KEYS:
        monkeypatch.delenv(key, raising=False)


@pytest.fixture
def app():
    from connectors import connectors_bp
    from riddlex.limits import limiter

    flask_app = Flask("connectors-test")
    flask_app.config.update(SECRET_KEY="test-secret-key-for-state-signing", TESTING=True,
                            JWT_SECRET_KEY="test-jwt-secret", JWT_ALGORITHM="HS256")
    flask_app.register_blueprint(connectors_bp, url_prefix="/api/connectors")
    limiter.init_app(flask_app)
    limiter.reset()
    return flask_app


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def users(monkeypatch):
    """Bearer tokens map to emails through the blueprint's own HTTPTokenAuth instance (no DB)."""
    from routes.auth import auth

    monkeypatch.setattr(auth, "verify_token_callback", lambda token: TOKENS.get(token))
    return {email: {"Authorization": f"Bearer {tok}"} for tok, email in TOKENS.items()}


class FakeStore:
    def __init__(self):
        self.accounts = {}
        self.flags = {}
        self.default_enabled = True

    def connectors_enabled(self, email):
        return self.flags.get(email, self.default_enabled)


@pytest.fixture
def store(monkeypatch):
    from connectors import repo

    s = FakeStore()

    def get_account(email, provider):
        row = s.accounts.get((email, provider))
        return dict(row) if row else None

    def list_accounts(email):
        return [dict(r) for (e, _), r in s.accounts.items() if e == email]

    def upsert_account(email, provider, label, refresh_token_enc, scopes):
        s.accounts[(email, provider)] = {"user_email": email, "provider": provider, "account_label": label,
                                         "refresh_token_enc": refresh_token_enc, "scopes": scopes,
                                         "status": "active"}

    def update_refresh_token(email, provider, refresh_token_enc):
        s.accounts[(email, provider)]["refresh_token_enc"] = refresh_token_enc

    def set_status(email, provider, status):
        s.accounts[(email, provider)]["status"] = status

    def delete_account(email, provider):
        s.accounts.pop((email, provider), None)

    for name, fn in {"get_account": get_account, "list_accounts": list_accounts,
                     "upsert_account": upsert_account, "update_refresh_token": update_refresh_token,
                     "set_status": set_status, "delete_account": delete_account,
                     "connectors_enabled": s.connectors_enabled}.items():
        monkeypatch.setattr(repo, name, fn)
    return s


class FakeProvider:
    """Stands in for GoogleProvider/OneDriveProvider. Records calls, never touches the network."""

    def __init__(self, pid, pkce):
        self.id = pid
        self.display_name = pid
        self.uses_pkce = pkce
        self.scopes = "fake-scope"
        self.exchange_refresh = "REFRESH-SENTINEL-ABC"
        self.new_refresh = None
        self.exchange_error = None
        self.refresh_error = None
        self.exchanged = []
        self.revoked = []

    def is_configured(self):
        return True

    def auth_url(self, state, redirect_uri, code_challenge=None):
        query = {"client_id": "fake-client", "redirect_uri": redirect_uri, "state": state}
        if code_challenge:
            query.update(code_challenge=code_challenge, code_challenge_method="S256")
        return "https://idp.test/authorize?" + urlencode(query)

    def exchange_code(self, code, redirect_uri, code_verifier=None):
        from connectors.providers.base import TokenResult
        self.exchanged.append((code, redirect_uri, code_verifier))
        if self.exchange_error:
            raise self.exchange_error
        return TokenResult(access_token="ACCESS-SENTINEL-XYZ", refresh_token=self.exchange_refresh,
                           expires_in=3600, account_label="a@x.com", scopes="fake-scope")

    def refresh(self, refresh_token):
        from connectors.providers.base import AccessResult
        if self.refresh_error:
            raise self.refresh_error
        return AccessResult(access_token="ACCESS-SENTINEL-XYZ", expires_in=3600,
                            new_refresh_token=self.new_refresh)

    def revoke(self, refresh_token):
        self.revoked.append(refresh_token)


@pytest.fixture
def fake_providers(monkeypatch):
    from connectors.providers.base import PROVIDERS

    fakes = {"google": FakeProvider("google", pkce=False), "onedrive": FakeProvider("onedrive", pkce=True)}
    for pid, fake in fakes.items():
        monkeypatch.setitem(PROVIDERS, pid, fake)
    return fakes
