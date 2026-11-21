"""GET /api/connectors/google/token: short-lived Drive access token for the Google Picker (section D)."""
from flask import jsonify

from riddlex.limits import limiter
from routes.auth import auth

from . import config, connectors_bp
from .errors import ConnectorError
from .tokens import get_access_result, require_enabled

PICKER_TOKEN_MAX_TTL = 3300  # seconds; the Picker only needs the token for one session


@connectors_bp.route("/google/token", methods=["GET"])
@limiter.limit("60/minute")
@auth.login_required
def google_token():
    email = auth.current_user()
    require_enabled(email)
    cfg = config.google_cfg()
    if not (cfg["api_key"] and cfg["app_id"]):
        raise ConnectorError(503, "not_configured", "Connector is not configured")
    _, result = get_access_result(email, "google")
    # The access token goes to the browser on purpose (Picker). It is drive.file only and never logged.
    resp = jsonify({"accessToken": result.access_token,
                    "expiresIn": min(int(result.expires_in), PICKER_TOKEN_MAX_TTL),
                    "clientId": cfg["client_id"], "apiKey": cfg["api_key"], "appId": cfg["app_id"]})
    resp.headers["Cache-Control"] = "no-store"
    return resp
