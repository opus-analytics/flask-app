"""Rate limiting for the unauthenticated /public/* endpoints (flask-limiter, keyed on client IP).

`limiter` has no default limits, so only routes decorated with `limit_get` / `limit_post` /
`limit_apply` are limited. app.py calls `limiter.init_app(app)` and puts ProxyFix (x_for=env RIDDLEX_TRUSTED_PROXIES, default 1) in
front so `request.remote_addr` is the real client IP. Storage: env RATELIMIT_STORAGE_URI
(default in-memory, per instance). Task 6 reuses `limit_apply` on /public/apply.
"""
import os

from flask import jsonify
from flask_limiter import Limiter, RateLimitExceeded
from flask_limiter.util import get_remote_address

GET_LIMIT = "60/minute"
POST_LIMIT = "20/minute"
APPLY_LIMIT = "5/minute"
RATE_LIMIT_MESSAGE = "Too many requests. Please try again shortly."

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[],
    storage_uri=os.environ.get("RATELIMIT_STORAGE_URI") or "memory://",
    strategy="fixed-window",
)

limit_get = limiter.limit(GET_LIMIT)
limit_post = limiter.limit(POST_LIMIT)
limit_apply = limiter.limit(APPLY_LIMIT)


def register_rate_limit_handler(app_or_bp):
    """Make 429s on `app_or_bp` JSON: {"message": ...} (no Retry-After body leakage needed)."""

    @app_or_bp.errorhandler(RateLimitExceeded)
    def _too_many(e):
        resp = jsonify({"message": RATE_LIMIT_MESSAGE})
        resp.status_code = 429
        retry = e.get_headers() if hasattr(e, "get_headers") else []
        for k, v in retry:
            if k.lower() == "retry-after":
                resp.headers[k] = v
        return resp
