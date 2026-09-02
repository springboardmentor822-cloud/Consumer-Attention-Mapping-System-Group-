"""
Tests for app/core/logging_config.py and the request-logging middleware
+ exception handler added in app/main.py.

Uses pytest's caplog rather than reading actual log files, to keep this
test suite free of filesystem side effects - the real file-writing
behavior (rotation, the two-file split) was verified manually against
real log files before this was written; see the PR/commit notes. What
matters for a regression test is the behavior: normal requests log at
INFO, server errors log at WARNING/ERROR, and an unhandled exception
never leaks a raw traceback to the client.
"""
import logging


def test_normal_request_is_logged_at_info(client, caplog):
    with caplog.at_level(logging.INFO, logger="app.requests"):
        client.get("/health")
    assert any("GET /health -> 200" in r.message for r in caplog.records)


def test_404_is_logged_at_info_not_error(client, caplog):
    """A 404 is a normal outcome, not a server error - it shouldn't
    show up as noise in the errors-only log."""
    with caplog.at_level(logging.INFO, logger="app.requests"):
        client.get("/this-route-does-not-exist")
    matching = [r for r in caplog.records if "-> 404" in r.message]
    assert matching
    assert matching[0].levelname == "INFO"


def test_unhandled_exception_is_logged_with_traceback_and_returns_clean_500(client, caplog):
    """The actual point of this feature: an unhandled exception must be
    captured server-side (with a traceback, not just a status code) AND
    the client must still get a clean, generic JSON error - never a raw
    traceback leaked over the network.

    Adds a temporary route directly to the shared app object that
    raises unconditionally - this is the same pattern already verified
    manually against a live server before this test was written (see
    the exception-logging feature's own commit/PR notes). A dependency-
    injection-time failure (e.g. a broken get_session) was tried first
    and turned out to bypass this handler entirely via a different
    Starlette code path (dependency resolution isn't wrapped the same
    way route bodies are) - that's a separate, deeper platform question
    this test isn't about; a route-body exception is the common,
    everyday case (a bug in a handler, a None where an object was
    expected) this feature exists for.
    """
    from app.main import app as fastapi_app
    from fastapi.testclient import TestClient

    @fastapi_app.get("/__test_only_crash_route__")
    def _crash_route():
        raise ValueError("intentional test crash for logging coverage")

    # A local TestClient with raise_server_exceptions=False, not the
    # shared `client` fixture - that fixture's default (re-raise into
    # the test) is the right default for the rest of the suite (loud
    # failures during development), but is specifically what this test
    # needs to disable to observe the real client-facing behavior: a
    # clean 500 response, not a re-raised exception in test code.
    local_client = TestClient(fastapi_app, raise_server_exceptions=False)

    try:
        with caplog.at_level(logging.ERROR, logger="app.requests"):
            resp = local_client.get("/__test_only_crash_route__")
    finally:
        fastapi_app.router.routes = [
            r for r in fastapi_app.router.routes if getattr(r, "path", None) != "/__test_only_crash_route__"
        ]

    assert resp.status_code == 500
    assert resp.json() == {"detail": "Internal server error"}
    assert "traceback" not in resp.text.lower()
    assert "valueerror" not in resp.text.lower(), "the raw exception type/message must never reach the client"

    error_records = [r for r in caplog.records if r.levelname == "ERROR"]
    assert error_records, "the exception must be logged server-side"
    assert any("UNHANDLED EXCEPTION" in r.message for r in error_records)
    logged_text = "\n".join(r.getMessage() + (r.exc_text or "") for r in error_records)
    assert "intentional test crash for logging coverage" in logged_text, "the real traceback must be in the log"
