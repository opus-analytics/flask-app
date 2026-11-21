class ConnectorError(Exception):
    """Carries an HTTP status, a machine code and a human message. The blueprint turns it into JSON."""

    def __init__(self, status: int, code: str, message: str):
        super().__init__(message)
        self.status, self.code, self.message = status, code, message
