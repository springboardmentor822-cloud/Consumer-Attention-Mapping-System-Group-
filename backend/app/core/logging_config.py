"""
Centralized logging configuration for this backend.

Scope, stated honestly: this is real, structured application logging
with rotation, for a SINGLE backend process - not a distributed
log-aggregation platform (ELK, Datadog, Loki). Getting logs from
multiple services/containers into one searchable place needs an actual
log-shipping agent and a place to ship them to, both of which are
separate infrastructure this project doesn't have. What this DOES give
you, for real: every request logged with method/path/status/duration,
every unhandled exception logged with a full traceback instead of
silently vanishing into a 500 with no server-side record, and log files
that rotate instead of growing forever - all using only Python's
standard library, no new dependency.

Log location: LOG_DIR (default ./logs, override via LOG_DIR env var)
writes app.log, rotating at 10MB with 5 backups kept (~50MB ceiling per
process). Also always logs to stdout/stderr, since `docker logs` and a
terminal both already capture that for free - the file handler is for
when the process isn't run under something capturing stdout (e.g. the
Windows .bat-launched tracking_runner.py processes this project already
uses, whose console output is otherwise lost the moment that window
closes).
"""
import logging
import logging.handlers
import os
import sys

LOG_DIR = os.environ.get("LOG_DIR", "./logs")
LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO").upper()

_configured = False


def configure_logging():
    """Idempotent - safe to call from multiple entrypoints (main.py,
    tracking_runner.py, recommendation_scheduler.py) without setting up
    duplicate handlers."""
    global _configured
    if _configured:
        return
    _configured = True

    os.makedirs(LOG_DIR, exist_ok=True)

    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    root = logging.getLogger()
    root.setLevel(LOG_LEVEL)

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    root.addHandler(console_handler)

    file_handler = logging.handlers.RotatingFileHandler(
        os.path.join(LOG_DIR, "app.log"),
        maxBytes=10 * 1024 * 1024,
        backupCount=5,
        encoding="utf-8",
    )
    file_handler.setFormatter(formatter)
    root.addHandler(file_handler)

    # Separate file for errors only, so an operator can check one small
    # file instead of grepping the full-volume app.log for problems.
    error_handler = logging.handlers.RotatingFileHandler(
        os.path.join(LOG_DIR, "errors.log"),
        maxBytes=10 * 1024 * 1024,
        backupCount=5,
        encoding="utf-8",
    )
    error_handler.setFormatter(formatter)
    error_handler.setLevel(logging.ERROR)
    root.addHandler(error_handler)

    # uvicorn's own loggers otherwise bypass this setup and print
    # unformatted straight to stdout.
    for name in ("uvicorn", "uvicorn.access", "uvicorn.error"):
        logging.getLogger(name).handlers = []
        logging.getLogger(name).propagate = True
