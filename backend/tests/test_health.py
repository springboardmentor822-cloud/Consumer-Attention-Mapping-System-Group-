"""
FIXED: the original version of this file did `from app.main import app` at
the TOP of the module, then built its own TestClient inline instead of
using the shared `client` fixture from conftest.py.

That top-level import is a real, confirmed problem once other tests in
this suite need app.core.db.engine patched to a test database: pytest
imports every test file during its COLLECTION phase, before any fixture
runs. A top-level `from app.main import app` therefore imports app.main
(and the 24+ service/api modules that do `from app.core.db import engine`
directly - see conftest.py's docstring) using the REAL, unpatched engine,
permanently - conftest.py's later patching can't undo an import that
already happened. I hit this directly: this file's original top-level
import caused `sqlite3.OperationalError: no such table: camera` failures
in unrelated tests, only when the full suite ran together (each test
passed fine in isolation, which is what made it non-obvious).

Fix: use the shared `client` fixture like every other test file, so
app.main is only ever imported after conftest.py's session fixture has
already patched the engine.
"""


def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
