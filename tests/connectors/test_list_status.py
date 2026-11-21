from unittest import mock

import mysql.connector

from connectors import repo


def _by_id(client, headers):
    resp = client.get("/api/connectors", headers=headers)
    assert resp.status_code == 200
    return {item["id"]: item for item in resp.get_json()}


def test_no_row_is_available(env, fake_providers, store, client, users):
    item = _by_id(client, users["a@x.com"])["google"]
    assert item["status"] == "available" and item["accountLabel"] is None and item["reason"] is None


def test_active_is_connected_with_label(env, fake_providers, store, client, users):
    store.accounts[("a@x.com", "google")] = {"account_label": "a@x.com", "status": "active"}
    item = _by_id(client, users["a@x.com"])["google"]
    assert item["status"] == "connected" and item["accountLabel"] == "a@x.com"


def test_error_is_error_with_label(env, fake_providers, store, client, users):
    store.accounts[("a@x.com", "onedrive")] = {"account_label": "me@outlook.com", "status": "error"}
    item = _by_id(client, users["a@x.com"])["onedrive"]
    assert item["status"] == "error" and item["accountLabel"] == "me@outlook.com"


def test_revoked_is_available(env, fake_providers, store, client, users):
    store.accounts[("a@x.com", "google")] = {"account_label": "a@x.com", "status": "revoked"}
    assert _by_id(client, users["a@x.com"])["google"]["status"] == "available"


def test_flag_false_is_disabled_not_enabled(env, fake_providers, store, client, users):
    store.flags["a@x.com"] = False
    item = _by_id(client, users["a@x.com"])["google"]
    assert item["status"] == "disabled" and item["reason"] == "not enabled"


def test_flag_query_failure_counts_as_disabled(monkeypatch):
    err = mysql.connector.Error(msg="Unknown column 'connectors_enabled'", errno=1054)
    with mock.patch.object(repo, "get_cursor", side_effect=err):
        assert repo.connectors_enabled("a@x.com") is False
