from flask import Blueprint

user_stats_bp = Blueprint("user_stats", __name__)

from . import routes  # noqa: E402,F401  (registers routes on user_stats_bp)

__all__ = ["user_stats_bp"]
