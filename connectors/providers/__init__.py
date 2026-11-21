from .base import PROVIDERS, get_provider, Provider, ProviderError
try:
    from .google import GoogleProvider; PROVIDERS["google"] = GoogleProvider()
except ImportError: pass  # shortcut: swallows ImportError so T1 lands before google.py; remove once merged
try:
    from .onedrive import OneDriveProvider; PROVIDERS["onedrive"] = OneDriveProvider()
except ImportError: pass  # shortcut: same as above for onedrive.py
