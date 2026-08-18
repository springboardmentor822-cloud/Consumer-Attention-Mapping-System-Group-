"""
In-memory API request/latency counters for the Admin dashboard's
Platform Monitoring section (API Requests, API Response Time KPIs from
Roles_Based_Dashboard.pdf's Admin Sec1/Sec4).

Deliberately in-memory, not persisted anywhere - resets to zero on every
uvicorn restart. That's a real limitation, not an oversight: this
answers "how is the API doing right now, since it last started", not
"give me historical API metrics over the last week" - that would need a
real time-series table + retention policy, out of scope for this pass.
Disclosed via uptime_seconds on the response itself, not hidden.

Rolling window (maxlen=200) for avg_response_time_ms rather than an
all-time average, so one slow request 3 hours ago doesn't permanently
skew the number - matches "how's it doing right now" better than a
lifetime average would.
"""

import time
from collections import deque
from threading import Lock

_start_time = time.time()
_total_requests = 0
_recent_durations_ms: deque = deque(maxlen=200)
_lock = Lock()


def record_request(duration_ms: float) -> None:
    global _total_requests
    with _lock:
        _total_requests += 1
        _recent_durations_ms.append(duration_ms)


def get_stats() -> dict:
    with _lock:
        total = _total_requests
        durations = list(_recent_durations_ms)

    avg_ms = round(sum(durations) / len(durations), 1) if durations else None

    return {
        "uptime_seconds": round(time.time() - _start_time, 1),
        "total_requests": total,
        "avg_response_time_ms": avg_ms,
        "avg_response_time_window": len(durations),  # how many samples avg_ms is over, so the frontend can show "(last N requests)" instead of implying it's all-time
    }
