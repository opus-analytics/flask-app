from __future__ import annotations
from dataclasses import dataclass, field
from typing import Optional

class ProviderError(Exception):
    """Raised by providers. code in: 'reconnect' (invalid_grant / 401 from provider), 'not_found', 'forbidden',
    'too_large', 'bad_request', 'upstream' (5xx or network), 'not_supported'. http_status is what our API returns."""
    STATUS = {"reconnect": 401, "not_found": 404, "forbidden": 403, "too_large": 413,
              "bad_request": 400, "upstream": 502, "not_supported": 400}
    def __init__(self, code: str, message: str = ""):
        super().__init__(message or code)
        self.code = code
        self.message = message or code
        self.http_status = self.STATUS.get(code, 502)

@dataclass
class TokenResult:
    access_token: str
    refresh_token: Optional[str]      # may be None if provider did not return one (google on re-consent without prompt)
    expires_in: int                   # seconds
    account_label: str                # email (google) / mail|userPrincipalName|displayName (onedrive)
    scopes: str                       # space separated, as granted

@dataclass
class AccessResult:
    access_token: str
    expires_in: int
    new_refresh_token: Optional[str] = None   # set when provider rotated it (onedrive always). Caller MUST persist it.

@dataclass
class FileEntry:
    id: str
    name: str
    is_folder: bool
    size: Optional[int] = None
    mime_type: Optional[str] = None
    modified: Optional[str] = None            # ISO 8601 string as given by provider
    web_url: Optional[str] = None

@dataclass
class FilePage:
    items: list = field(default_factory=list)  # list[FileEntry]
    next_page_token: Optional[str] = None      # opaque, pass back as page_token
    folder_id: Optional[str] = None            # id of the folder listed ('root' resolved to real id if known else 'root')
    folder_name: Optional[str] = None
    parent_id: Optional[str] = None            # for "up" navigation, None at root

@dataclass
class UploadResult:
    id: str
    name: str
    web_url: Optional[str] = None
    placed_in_folder: bool = True              # false if google had to drop `parents`

MAX_BYTES = 25 * 1024 * 1024                   # hard cap for download and upload

class Provider:
    id: str = ""                  # 'google' | 'onedrive'
    display_name: str = ""
    uses_pkce: bool = False
    scopes: str = ""

    def is_configured(self) -> bool: raise NotImplementedError
    def auth_url(self, state: str, redirect_uri: str, code_challenge: Optional[str] = None) -> str: raise NotImplementedError
    def exchange_code(self, code: str, redirect_uri: str, code_verifier: Optional[str] = None) -> TokenResult: raise NotImplementedError
    def refresh(self, refresh_token: str) -> AccessResult: raise NotImplementedError   # raises ProviderError('reconnect') on invalid_grant
    def revoke(self, refresh_token: str) -> None: raise NotImplementedError            # best effort, never raises
    def list_files(self, access_token: str, folder_id: Optional[str], page_token: Optional[str]) -> FilePage: raise ProviderError("not_supported", "use picker")
    def download(self, access_token: str, file_id: str) -> tuple:                       # -> (filename:str, data:bytes, mimetype:str)
        raise NotImplementedError
    def upload(self, access_token: str, filename: str, data: bytes, mimetype: str, folder_id: Optional[str]) -> UploadResult: raise NotImplementedError

PROVIDERS: dict = {}          # id -> Provider instance, filled by providers/__init__.py

def get_provider(pid: str) -> Provider:
    p = PROVIDERS.get(pid)
    if p is None:
        raise ProviderError("not_found", "Unknown connector")
    return p
