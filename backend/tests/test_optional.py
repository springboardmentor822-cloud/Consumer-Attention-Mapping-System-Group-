from __future__ import annotations

import unittest
from unittest.mock import patch

from app.ml.errors import MissingOptionalDependency
from app.ml.optional import require_module


class OptionalDependencyTests(unittest.TestCase):
    def test_error_contains_feature_package_and_command(self) -> None:
        with patch("app.ml.optional.importlib.import_module", side_effect=ImportError("not installed")):
            with self.assertRaises(MissingOptionalDependency) as raised:
                require_module("heavy_module", purpose="Model training", pip_name="heavy-package")
        message = str(raised.exception)
        self.assertIn("Model training", message)
        self.assertIn("heavy-package", message)
        self.assertIn("python -m pip install heavy-package", message)


if __name__ == "__main__":
    unittest.main()
