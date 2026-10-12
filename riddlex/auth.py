import datetime
from functools import wraps

from flask import g, jsonify
from flask_httpauth import HTTPTokenAuth

from opus_api.models.subscriptions import Subscription
from routes.auth import verify_token  # existing JWT check; returns the user's email or None

from .errors import ApiError

PRODUCT = "RiddleX"

# RiddleX-scoped auth instance: same token check as routes.auth.auth, but 401s use the
# {"message": ...} error contract instead of flask_httpauth's plain-text body.
auth = HTTPTokenAuth(scheme="Bearer")
auth.verify_token(verify_token)


@auth.error_handler
def _unauthorized(status):
    return jsonify({"message": "Your session has expired. Please sign in again."}), status


def _is_current(sub, now):
    exp = sub.subscription_expiration_date
    return exp is None or exp > now


def _resolve_org(user_email: str) -> str:
    """Tenant = owner of the user's active, unexpired RiddleX subscription (newest first)."""
    now = datetime.datetime.utcnow()
    subs = [
        s for s in (Subscription.find_active_by_email(user_email) or [])
        if s.subscription == PRODUCT and s.owner and _is_current(s, now)
    ]
    subs.sort(key=lambda s: (s.subscription_from_date or datetime.datetime.min, s.my_row_id), reverse=True)
    if subs:
        return subs[0].owner
    raise ApiError(403, "An active RiddleX subscription is required.")


def org_required(fn):
    @wraps(fn)
    @auth.login_required
    def wrapper(*args, **kwargs):
        g.user_email = auth.current_user()
        g.org_email = _resolve_org(g.user_email)
        return fn(*args, **kwargs)

    return wrapper
