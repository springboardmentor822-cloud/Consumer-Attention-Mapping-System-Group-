"""Lazy optional-dependency loading with actionable error messages."""

from __future__ import annotations

import importlib
from types import ModuleType

from app.ml.errors import MissingOptionalDependency


def require_module(
    module_name: str,
    *,
    purpose: str,
    pip_name: str | None = None,
    install_command: str | None = None,
) -> ModuleType:
    """Import an optional module or explain exactly how to enable the feature."""

    try:
        return importlib.import_module(module_name)
    except (ImportError, OSError) as exc:
        package = pip_name or module_name
        command = install_command or f"python -m pip install {package}"
        raise MissingOptionalDependency(
            f"{purpose} requires the optional dependency '{package}'. "
            f"Install it with `{command}` and retry. Original import error: {exc}"
        ) from exc
