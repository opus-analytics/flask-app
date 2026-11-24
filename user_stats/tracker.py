"""Usage tracking. Never raises, never changes a route's response, never stores request bodies."""
import functools
import logging
from datetime import datetime

from flask import request

import routes.auth as _route_auth
from . import repo

logger = logging.getLogger(__name__)


def _coerce_user_id(user_id):
    try:
        return int(user_id) if user_id is not None else None
    except (TypeError, ValueError):
        return None


def record_event(email, event_type, feature=None, product=None, meta=None, user_id=None):
    """Insert one user_activity row. Returns True on success, False otherwise. Never raises."""
    try:
        if not email:
            return False
        repo.insert_event(
            email, event_type, feature, product, meta,
            _coerce_user_id(user_id), datetime.utcnow(),
        )
        return True
    except Exception:
        logger.warning("user_activity insert failed (event_type=%s, feature=%s)", event_type, feature, exc_info=False)
        return False


def record_login(email, user_id=None):
    """Login bookkeeping: login event + users.last_login_at / login_count. Never raises."""
    try:
        if not email:
            return False
        record_event(email, "login", user_id=user_id)
        repo.touch_login(email, datetime.utcnow())
        return True
    except Exception:
        logger.warning("login tracking failed", exc_info=False)
        return False


def _status_of(rv):
    if isinstance(rv, tuple):
        if len(rv) >= 2 and isinstance(rv[1], int):
            return rv[1]
        return 200
    status = getattr(rv, "status_code", None)
    return status if isinstance(status, int) else 200


def _optional_user_email():
    """Email from a valid Bearer token, or None (anonymous / invalid / any error)."""
    try:
        header = request.headers.get("Authorization", "")
        scheme, _, token = header.partition(" ")
        token = token.strip()
        if scheme.lower() != "bearer" or not token:
            return None
        return _route_auth.verify_token(token) or None
    except Exception:
        return None


def track(feature, product):
    """Decorator for Flask views. Place it directly under the route decorator."""
    def decorator(view):
        @functools.wraps(view)
        def wrapper(*args, **kwargs):
            rv = view(*args, **kwargs)
            try:
                if _status_of(rv) < 400:
                    email = _optional_user_email()
                    if email:
                        record_event(email, "feature_use", feature=feature, product=product)
            except Exception:
                logger.warning("feature tracking failed (feature=%s)", feature, exc_info=False)
            return rv
        return wrapper
    return decorator
