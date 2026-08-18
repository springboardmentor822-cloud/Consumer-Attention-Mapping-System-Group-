"""
Milestone 4 Redis Streams alert worker.

This process periodically evaluates the four required alert types and then
persists any published alerts into the existing EventLog as auditable
`alert_*` events. The raw alert remains in Redis Streams as well.

Run separately from uvicorn:
    python -m app.services.alert_worker
"""

import json
import time

from sqlmodel import Session

from app.core.db import engine
from app.core.redis_client import redis_client
from app.models.event_log import EventCategory
from app.services.alert_engine import ALERT_STREAM_KEY, evaluate_all_alerts
from app.services.audit import log_event

CONSUMER_GROUP = "alert_eventlog_persister"
CONSUMER_NAME = "backend-alert-worker"
EVALUATION_INTERVAL_SECONDS = 60
BLOCK_MILLISECONDS = 5000


def ensure_consumer_group() -> None:
    try:
        redis_client.xgroup_create(
            ALERT_STREAM_KEY,
            CONSUMER_GROUP,
            id="0-0",
            mkstream=True,
        )
        print(
            f"Created Redis consumer group "
            f"{CONSUMER_GROUP} on {ALERT_STREAM_KEY}"
        )
    except Exception as exc:
        # BUSYGROUP means it already exists; Redis-py surfaces this as a
        # ResponseError. We don't need a separate dependency just to check.
        if "BUSYGROUP" not in str(exc):
            raise


def persist_alert_message(message_id: str, fields: dict[str, str]) -> None:
    alert_type = fields.get("alert_type", "unknown")
    target_id = fields.get("target_id")
    created_at = fields.get("created_at")
    raw_payload = fields.get("payload", "{}")

    try:
        payload = json.loads(raw_payload)
    except json.JSONDecodeError:
        payload = {"raw_payload": raw_payload}

    description = (
        f"Alert generated: {alert_type}"
        + (f" for target {target_id}" if target_id else "")
    )

    with Session(engine) as session:
        log_event(
            session=session,
            category=EventCategory.audit,
            event_type=f"alert_{alert_type}",
            description=description,
            target_type="camera" if alert_type in {"camera_health", "traffic_anomaly"} else "shelf",
            target_id=None,
            metadata={
                "redis_stream": ALERT_STREAM_KEY,
                "redis_message_id": message_id,
                "created_at": created_at,
                "alert": payload,
            },
            commit=True,
        )


def drain_alert_stream() -> int:
    """Persist newly published alerts and acknowledge them."""
    processed = 0

    while True:
        response = redis_client.xreadgroup(
            groupname=CONSUMER_GROUP,
            consumername=CONSUMER_NAME,
            streams={ALERT_STREAM_KEY: ">"},
            count=50,
            block=BLOCK_MILLISECONDS,
        )

        if not response:
            break

        for _, messages in response:
            for message_id, fields in messages:
                try:
                    persist_alert_message(message_id, fields)
                    redis_client.xack(
                        ALERT_STREAM_KEY,
                        CONSUMER_GROUP,
                        message_id,
                    )
                    processed += 1
                except Exception as exc:
                    # Do not ACK failed messages. Redis will keep them
                    # pending so the next worker run can retry them.
                    print(
                        f"ERROR: failed to persist alert {message_id}: {exc}"
                    )

    return processed


def run() -> None:
    ensure_consumer_group()
    print("Alert worker started.")
    print(f"Evaluation interval: {EVALUATION_INTERVAL_SECONDS}s")

    while True:
        try:
            evaluate_all_alerts()
            processed = drain_alert_stream()
            if processed:
                print(f"Persisted {processed} alert event(s) to EventLog.")
        except KeyboardInterrupt:
            print("Alert worker stopped.")
            break
        except Exception as exc:
            print(f"ERROR: alert worker cycle failed: {exc}")

        time.sleep(EVALUATION_INTERVAL_SECONDS)


if __name__ == "__main__":
    run()
