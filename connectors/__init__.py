from flask import Blueprint, jsonify

from riddlex.limits import register_rate_limit_handler

connectors_bp = Blueprint("connectors", __name__)
register_rate_limit_handler(connectors_bp)

from .errors import ConnectorError  # noqa: E402
from .providers.base import ProviderError  # noqa: E402


@connectors_bp.errorhandler(ConnectorError)
def _connector_error(e):
    return jsonify({"error": e.code, "message": e.message}), e.status


@connectors_bp.errorhandler(ProviderError)
def _provider_error(e):
    return jsonify({"error": e.code, "message": e.message}), e.http_status


from . import routes_core  # noqa: E402,F401  (registers routes on connectors_bp)
try:
    from . import routes_google  # noqa: E402,F401
    from . import routes_files  # noqa: E402,F401
except ImportError:  # shortcut: tolerates missing T2 route modules; remove this try once they are merged
    pass

__all__ = ["connectors_bp", "ConnectorError"]
