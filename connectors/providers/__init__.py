from .base import PROVIDERS, get_provider, Provider, ProviderError
from .google import GoogleProvider
from .onedrive import OneDriveProvider
PROVIDERS["google"] = GoogleProvider()
PROVIDERS["onedrive"] = OneDriveProvider()
