from flask import Blueprint

from .errors import ApiError, register_error_handlers

riddlex_bp = Blueprint("riddlex", __name__)
register_error_handlers(riddlex_bp)

from . import jobs_routes  # noqa: E402,F401  (registers routes on riddlex_bp)
from . import career_site_routes  # noqa: E402,F401  (registers routes on riddlex_bp)
from . import public_routes  # noqa: E402,F401  (registers routes on riddlex_bp)
from . import applications_routes  # noqa: E402,F401  (registers routes on riddlex_bp)

__all__ = ["riddlex_bp", "ApiError"]
