"""Tracker tests. A throwaway Flask app with tracked views; repo.insert_event is replaced with a recorder."""
import pytest
from flask import Flask, Response, jsonify

import routes.auth as route_auth
from user_stats import repo, tracker
from user_stats.tracker import track

GOOD = "good-token"


@pytest.fixture
def events(monkeypatch):
    rows = []
    monkeypatch.setattr(repo, "insert_event", lambda *a, **k: rows.append(a))
    return rows


@pytest.fixture
def tapp(monkeypatch):
    """Throwaway app; verify_token accepts only GOOD (returns user@x.com)."""
    monkeypatch.setattr(route_auth, "verify_token", lambda t: "user@x.com" if t == GOOD else None)
    app = Flask("tracker-test")

    @app.route("/ok", methods=["POST"])
    @track("resume_analyze", "Start")
    def ok():
        return jsonify({"a": 1}), 201

    @app.route("/tuple", methods=["GET"])
    @track("salary_chart", "Advance")
    def tup():
        return "plain body", 200, {"X-Test": "1"}

    @app.route("/resp", methods=["GET"])
    @track("survey_create", "Motivera")
    def resp():
        return Response("raw", status=202)

    @app.route("/bad", methods=["POST"])
    @track("resume_analyze", "Start")
    def bad():
        return jsonify({"message": "nope"}), 400

    @app.route("/boom", methods=["GET"])
    @track("resume_analyze", "Start")
    def boom():
        raise RuntimeError("view failure")

    @app.route("/dict", methods=["GET"])
    @track("resume_analyze", "Start")
    def as_dict():
        return {"x": 1}

    return app.test_client()


def auth(tok=GOOD):
    return {"Authorization": f"Bearer {tok}"}


def test_anonymous_request_records_nothing(tapp, events):
    r = tapp.post("/ok")
    assert r.status_code == 201
    assert events == []


def test_invalid_token_records_nothing(tapp, events):
    r = tapp.post("/ok", headers=auth("bad-token"))
    assert r.status_code == 201
    assert events == []


def test_verify_token_exception_records_nothing(tapp, events, monkeypatch):
    def boom(_t):
        raise RuntimeError("db down")
    monkeypatch.setattr(route_auth, "verify_token", boom)
    r = tapp.post("/ok", headers=auth())
    assert r.status_code == 201
    assert events == []


def test_valid_token_records_exactly_once(tapp, events):
    r = tapp.post("/ok", headers=auth(), json={"resume_text": "SECRET BODY"})
    assert r.status_code == 201
    assert r.get_json() == {"a": 1}
    assert len(events) == 1
    email, event_type, feature, product, meta, user_id, created_at = events[0]
    assert (email, event_type, feature, product) == ("user@x.com", "feature_use", "resume_analyze", "Start")
    assert meta is None and user_id is None
    assert "SECRET BODY" not in repr(events[0])


def test_status_400_and_above_records_nothing(tapp, events):
    assert tapp.post("/bad", headers=auth()).status_code == 400
    assert events == []


def test_tuple_with_headers_passes_through_unchanged(tapp, events):
    r = tapp.get("/tuple", headers=auth())
    assert r.status_code == 200
    assert r.data == b"plain body"
    assert r.headers["X-Test"] == "1"
    assert len(events) == 1


def test_response_object_passes_through(tapp, events):
    r = tapp.get("/resp", headers=auth())
    assert r.status_code == 202
    assert r.data == b"raw"
    assert len(events) == 1


def test_dict_return_is_200_and_recorded(tapp, events):
    r = tapp.get("/dict", headers=auth())
    assert r.get_json() == {"x": 1}
    assert len(events) == 1


def test_view_exception_records_nothing(tapp, events):
    r = tapp.get("/boom", headers=auth())
    assert r.status_code == 500
    assert events == []


def test_db_failure_does_not_break_response(tapp, monkeypatch):
    def fail(*a, **k):
        raise RuntimeError("insert failed")
    monkeypatch.setattr(repo, "insert_event", fail)
    r = tapp.post("/ok", headers=auth())
    assert r.status_code == 201
    assert r.get_json() == {"a": 1}


def test_record_event_never_raises_and_skips_blank_email(monkeypatch):
    def fail(*a, **k):
        raise RuntimeError("boom")
    monkeypatch.setattr(repo, "insert_event", fail)
    assert tracker.record_event("u@x.com", "feature_use") is False
    assert tracker.record_event(None, "feature_use") is False


@pytest.mark.parametrize("raw, expected", [(7, 7), ("12", 12), ("abc", None), (None, None), ("", None)])
def test_user_id_is_coerced_to_int_or_none(monkeypatch, raw, expected):
    seen = []
    monkeypatch.setattr(repo, "insert_event", lambda *a, **k: seen.append(a))
    tracker.record_event("u@x.com", "login", user_id=raw)
    assert seen[0][5] == expected
