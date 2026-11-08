"""Shared errors for configured language-model providers."""


class GnaniIntegrationUnavailable(RuntimeError):
    """Raised when a configured provider is unavailable."""
