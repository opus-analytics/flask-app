"""GET /api/user/stats (contract: dashboard_contract.md). Email comes only from the token."""
from datetime import datetime

from flask import jsonify, request

from . import repo, user_stats_bp
from .auth import auth
from .service import build_stats


@user_stats_bp.route("/stats", methods=["GET"])
@auth.login_required
def stats():
    raw = request.args.get("months", "6")
    try:
        months = int(raw)
    except (TypeError, ValueError):
        months = 0
    if not 1 <= months <= 12:
        return jsonify({"message": "Query parameter 'months' must be an integer between 1 and 12."}), 400

    email = auth.current_user()
    data = build_stats(
        email=email,
        full_name=repo.get_user_name(email),
        events=repo.events_for_user(email),
        sub_rows=repo.subscription_rows(email),
        tracking_since=repo.tracking_since(),
        now=datetime.utcnow(),
        months=months,
    )
    return jsonify(data)
