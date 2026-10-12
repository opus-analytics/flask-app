from flask import jsonify
from flask_httpauth import HTTPTokenAuth

from routes.auth import verify_token  # existing JWT check; returns the user's email or None

# Salaries-scoped auth instance: login only (no subscription check), 401s use the {"message": ...} contract.
auth = HTTPTokenAuth(scheme="Bearer")
auth.verify_token(verify_token)


@auth.error_handler
def _unauthorized(status):
    return jsonify({"message": "Your session has expired. Please sign in again."}), status
