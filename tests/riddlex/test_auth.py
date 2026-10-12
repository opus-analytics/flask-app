from flask import Blueprint, Flask

from riddlex.errors import ApiError, register_error_handlers


# --- pure unit test: no DB, no app import ---
def test_api_error_handler_returns_message_shape():
    app = Flask(__name__)
    bp = Blueprint("t", __name__)
    register_error_handlers(bp)

    @bp.route("/boom")
    def boom():
        raise ApiError(409, "Already applied.")

    app.register_blueprint(bp)
    r = app.test_client().get("/boom")
    assert r.status_code == 409
    assert r.get_json() == {"message": "Already applied."}


# --- no DB needed: an absent/garbage token is rejected before any user lookup ---
def test_requires_bearer_token(anon_client):
    for headers in ({}, {"Authorization": "Bearer nope"}):
        r = anon_client.get("/api/riddlex/jobs", headers=headers)
        assert r.status_code == 401
        assert isinstance(r.get_json()["message"], str)  # {"message"} contract, not plain text


def test_cors_preflight_from_vite_dev_server(anon_client):
    r = anon_client.options(
        "/api/riddlex/jobs",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "authorization,content-type",
        },
    )
    assert r.headers.get("Access-Control-Allow-Origin") == "http://localhost:5173"


# --- DB-backed (skipped unless RIDDLEX_TEST_DB_* is set) ---
def test_requires_active_riddlex_subscription(client, auth_headers):
    r = client.get("/api/riddlex/jobs", headers=auth_headers(subscription=None))
    assert r.status_code == 403
    assert "RiddleX" in r.get_json()["message"]


def test_inactive_subscription_is_403(client, auth_headers):
    assert client.get("/api/riddlex/jobs", headers=auth_headers(status="expired")).status_code == 403


def test_expired_subscription_is_403(client, auth_headers):
    assert client.get("/api/riddlex/jobs", headers=auth_headers(expires_in_days=-1)).status_code == 403


def test_assigned_user_resolves_to_owner_org(client, auth_headers):
    # a team member assigned to owner@x.com's subscription sees the owner's data
    h = auth_headers(org="owner@x.com", user="member@x.com")
    assert client.get("/api/riddlex/jobs", headers=h).status_code == 200
