from connectors import config


def test_frontend_origins_parsing(monkeypatch):
    monkeypatch.setenv("FRONTEND_ORIGIN", " https://a.test/ , http://localhost:5173,, https://b.test//  ")
    assert config.frontend_origins() == ["https://a.test", "http://localhost:5173", "https://b.test"]


def test_redirect_uri_strips_trailing_slash(monkeypatch):
    monkeypatch.setenv("PUBLIC_API_BASE", "https://api.test/")
    assert config.redirect_uri("google") == "https://api.test/api/connectors/google/callback"


def test_missing_env_reports_not_configured(no_env, client, users, store):
    assert config.common_configured() is False
    resp = client.get("/api/connectors", headers=users["a@x.com"])
    assert resp.status_code == 200
    items = resp.get_json()
    assert [(i["id"], i["status"], i["reason"]) for i in items] == [
        ("google", "disabled", "not configured"), ("onedrive", "disabled", "not configured")]


def test_provider_own_is_configured_false_without_env(no_env):
    from connectors.providers.base import PROVIDERS
    for provider in PROVIDERS.values():  # empty until the provider modules land; then each must agree
        assert provider.is_configured() is False
