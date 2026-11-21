from connectors import crypto


def _connect(store, email, provider, plain):
    store.accounts[(email, provider)] = {"account_label": email, "status": "active",
                                         "refresh_token_enc": crypto.encrypt(plain)}


def test_removes_row_and_revokes_plain_token(env, fake_providers, store, client, users):
    _connect(store, "a@x.com", "google", "REFRESH-DISC-1")
    resp = client.delete("/api/connectors/google", headers=users["a@x.com"])
    assert resp.status_code == 200 and resp.get_json() == {"ok": True}
    assert ("a@x.com", "google") not in store.accounts
    assert fake_providers["google"].revoked == ["REFRESH-DISC-1"]


def test_idempotent_when_absent(env, fake_providers, store, client, users):
    resp = client.delete("/api/connectors/google", headers=users["a@x.com"])
    assert resp.status_code == 200 and resp.get_json() == {"ok": True}
    assert fake_providers["google"].revoked == []


def test_undecryptable_token_still_deletes(env, fake_providers, store, client, users):
    store.accounts[("a@x.com", "google")] = {"account_label": "a", "status": "error",
                                             "refresh_token_enc": "garbage"}
    resp = client.delete("/api/connectors/google", headers=users["a@x.com"])
    assert resp.status_code == 200 and ("a@x.com", "google") not in store.accounts


def test_other_user_is_not_affected(env, fake_providers, store, client, users):
    _connect(store, "a@x.com", "google", "REFRESH-A")
    client.delete("/api/connectors/google", headers=users["b@x.com"])
    assert ("a@x.com", "google") in store.accounts


def test_unknown_provider_is_404(env, fake_providers, store, client, users):
    resp = client.delete("/api/connectors/dropbox", headers=users["a@x.com"])
    assert resp.status_code == 404 and resp.get_json()["error"] == "unknown_provider"


def test_no_jwt_is_401(env, fake_providers, client):
    assert client.delete("/api/connectors/google").status_code == 401
