from flask import Blueprint

salaries_bp = Blueprint("salaries", __name__)

from . import routes  # noqa: E402,F401  (registers routes on salaries_bp)

__all__ = ["salaries_bp"]
