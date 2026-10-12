from flask import jsonify


class ApiError(Exception):
    def __init__(self, status: int, message: str):
        super().__init__(message)
        self.status, self.message = status, message


def register_error_handlers(bp):
    @bp.errorhandler(ApiError)
    def _api_error(e):
        return jsonify({"message": e.message}), e.status
