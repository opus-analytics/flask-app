"""Register / verification-email tests. No DB or network: User and AzureGraphMailer are mocked."""
import os
import pytest
from flask import Flask

import routes.auth as auth_mod

TEMPLATES = os.path.join(os.path.dirname(__file__), "..", "..", "opus_api", "templates")


class FakeUser:
    def __init__(self, user_id=7, email="a@b.com"):
        self.user_id = user_id
        self.email = email


@pytest.fixture
def app():
    app = Flask(__name__, template_folder=TEMPLATES)
    app.config.update(TESTING=True, SECRET_KEY="test-secret", FRONTEND_ORIGIN="https://example.test/")
    app.register_blueprint(auth_mod.auth_bp, url_prefix="/api/auth")
    return app


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def mocks(monkeypatch):
    state = {"created": [], "sent": [], "mail_ok": True, "existing": None}

    def find_by_email(email):
        return state["existing"]

    def create_user(email, password, verification_status="Pending", full_name=None, company_name=None):
        state["created"].append(dict(email=email, password=password, full_name=full_name, company_name=company_name))
        return FakeUser(email=email)

    class FakeMailer:
        def send_email(self, subject, to_email, body_content, is_html=False):
            state["sent"].append(dict(subject=subject, to=to_email, body=body_content, is_html=is_html))
            return state["mail_ok"]

    monkeypatch.setattr(auth_mod.User, "find_by_email", staticmethod(find_by_email))
    monkeypatch.setattr(auth_mod.User, "create_user", staticmethod(create_user))
    monkeypatch.setattr(auth_mod.User, "save_verification_token", staticmethod(lambda *a, **k: True))
    monkeypatch.setattr(auth_mod, "AzureGraphMailer", FakeMailer)
    return state


def test_missing_fields_400(client, mocks):
    assert client.post("/api/auth/register", json={}).status_code == 400
    assert client.post("/api/auth/register", json={"email": "a@b.com"}).status_code == 400
    assert client.post("/api/auth/register", json={"password": "x"}).status_code == 400
    assert mocks["created"] == []


def test_non_json_body_400(client, mocks):
    r = client.post("/api/auth/register", data="not json", content_type="text/plain")
    assert r.status_code == 400
    r = client.post("/api/auth/register", data="[1,2]", content_type="application/json")
    assert r.status_code == 400


def test_duplicate_409(client, mocks):
    mocks["existing"] = FakeUser()
    r = client.post("/api/auth/register", json={"email": "a@b.com", "password": "pw"})
    assert r.status_code == 409
    assert mocks["created"] == []


def test_success_201(client, mocks):
    r = client.post("/api/auth/register", json={
        "email": "  A@B.com ", "password": "pw", "full_name": " Jane Doe ", "company_name": "Acme"})
    assert r.status_code == 201
    assert r.get_json()["email_sent"] is True
    assert mocks["created"] == [dict(email="a@b.com", password="pw", full_name="Jane Doe", company_name="Acme")]
    sent = mocks["sent"][0]
    assert sent["to"] == "a@b.com" and sent["is_html"] is True
    assert sent["subject"] == "Opus Analytics - Verify your email"
    assert "https://example.test/auth/verify-email?token=" in sent["body"]


def test_camel_case_names(client, mocks):
    client.post("/api/auth/register", json={"email": "a@b.com", "password": "pw", "fullName": "J", "companyName": "C"})
    assert mocks["created"][0]["full_name"] == "J"
    assert mocks["created"][0]["company_name"] == "C"


def test_mailer_failure_202(client, mocks):
    mocks["mail_ok"] = False
    r = client.post("/api/auth/register", json={"email": "a@b.com", "password": "pw"})
    assert r.status_code == 202
    assert r.get_json()["email_sent"] is False


def test_mailer_exception_202(client, mocks, monkeypatch):
    class Boom:
        def __init__(self):
            raise RuntimeError("no creds")
    monkeypatch.setattr(auth_mod, "AzureGraphMailer", Boom)
    r = client.post("/api/auth/register", json={"email": "a@b.com", "password": "pw"})
    assert r.status_code == 202


def test_verify_handles_none_expiration(client, app, monkeypatch):
    from itsdangerous import URLSafeTimedSerializer
    token = URLSafeTimedSerializer("test-secret").dumps("a@b.com", salt="email-verification-salt")

    class U:
        user_id = 1
        verification_status = "Pending"
        verification_token = token
        token_expiration = None

    monkeypatch.setattr(auth_mod.User, "find_by_email", staticmethod(lambda e: U()))
    r = client.get(f"/api/auth/verify-email?token={token}")
    assert r.status_code == 400


def _verify_setup(monkeypatch, existing_subs, fail_create=False):
    import datetime
    from itsdangerous import URLSafeTimedSerializer
    token = URLSafeTimedSerializer("test-secret").dumps("a@b.com", salt="email-verification-salt")

    class U:
        user_id = 1
        email = "a@b.com"
        verification_status = "Pending"
        verification_token = token
        token_expiration = datetime.datetime.utcnow() + datetime.timedelta(hours=1)

    calls = []

    def create_sub(**kw):
        if fail_create:
            raise RuntimeError("db down")
        calls.append(kw)

    monkeypatch.setattr(auth_mod.User, "find_by_email", staticmethod(lambda e: U()))
    monkeypatch.setattr(auth_mod.User, "update_verification_status", staticmethod(lambda *a: True))
    monkeypatch.setattr(auth_mod.User, "save_verification_token", staticmethod(lambda *a: True))
    monkeypatch.setattr(auth_mod.Subscription, "find_by_email", staticmethod(lambda e: existing_subs))
    monkeypatch.setattr(auth_mod.Subscription, "create_subscription", staticmethod(create_sub))
    return token, calls


def test_verify_creates_free_subscription(client, monkeypatch):
    token, calls = _verify_setup(monkeypatch, None)
    r = client.get(f"/api/auth/verify-email?token={token}")
    assert r.status_code == 200
    assert len(calls) == 1
    assert calls[0]["subscription"] == "Free" and calls[0]["subscription_status"] == "Active"
    assert calls[0]["email"] == "a@b.com" and calls[0]["owner"] == "a@b.com"
    assert calls[0]["tag"] == "self-signup"
    assert calls[0]["subscription_expiration_date"] is None and calls[0]["resource_id"] is None


def test_verify_skips_when_active_subscription(client, monkeypatch):
    token, calls = _verify_setup(monkeypatch, [object()])
    assert client.get(f"/api/auth/verify-email?token={token}").status_code == 200
    assert calls == []


def test_verify_succeeds_if_subscription_fails(client, monkeypatch):
    token, _ = _verify_setup(monkeypatch, None, fail_create=True)
    assert client.get(f"/api/auth/verify-email?token={token}").status_code == 200
