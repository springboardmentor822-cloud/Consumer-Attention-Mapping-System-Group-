"""Exceptions raised by the optional machine-learning layer."""


class MLError(RuntimeError):
    """Base class for ML-layer failures."""


class MissingOptionalDependency(MLError):
    """Raised when an explicitly requested ML feature is not installed."""


class MLConfigurationError(MLError, ValueError):
    """Raised when an ML run has an invalid or unsafe configuration."""


class DatasetValidationError(MLConfigurationError):
    """Raised when a dataset contains validation errors."""
