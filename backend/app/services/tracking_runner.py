"""
Connects detection/tracking output to the Redis ingest queue.
detection.py stays Redis-agnostic on purpose (see the discussion this
session) - it just yields dicts, same as before, so it's still safely
importable by test/smoke-test scripts without needing Redis running at
all. This file is the one place that actually pushes those dicts onto
the stream, for real pipeline runs.

Usage:
    python -m app.services.tracking_runner <camera_id> [--product] [--max-age N] [--tracker PATH]

Defaults to PersonDetector; pass --product to run ProductDetector instead
against the same camera. --max-age only applies to ProductDetector - see
its help text below for why you'd change it.

--tracker: per-camera override for PersonDetector's ByteTrack config.
Defaults to PersonDetector's own built-in default (stock bytetrack.yaml,
buffer=30 - safe for crowded/dense cameras like Zone_1). Pass an explicit
path to opt a SPECIFIC camera into a different config, e.g. for Camera 2
(Zone_2.mp4), which is confirmed to behave well with the tuned
buffer=60 config (bytetrack_buffer60.yaml, in backend/ root) - fixes its
known ID-churn issue without touching the global default other cameras
rely on. Only apply this flag to cameras you've specifically validated
it against (see tune_person_tracker.py) - it caused a severe regression
on Zone_1/Camera 1 when applied globally, see detection.py's comments.
"""
import argparse
import time
import uuid
from datetime import datetime

from sqlmodel import Session, select
from app.core.db import engine
from app.core.redis_client import push_tracking_event
from app.models.camera import Camera
from app.services.detection import PersonDetector, ProductDetector
from app.services.frame_pipeline import get_camera_source


def run(
    camera_id: uuid.UUID,
    use_product_detector: bool = False,
    max_age: int = 30,
    tracker: str | None = None,
):
    # Load camera once before starting the detector.
    with Session(engine) as session:
        camera = session.get(Camera, camera_id)

    if not camera:
        print(f"No Camera found with id {camera_id}")
        return

    source = get_camera_source(camera)

    if use_product_detector:
        detector = ProductDetector(max_age=max_age)

        if tracker:
            print(
                "NOTE: --tracker only applies to PersonDetector "
                "(ByteTrack) - ignored for ProductDetector (DeepSORT)."
            )
    else:
        detector = PersonDetector(
            **({"tracker": tracker} if tracker else {})
        )

    pushed = 0

    # Update camera liveness approximately every 15 seconds.
    # This is intentionally NOT done for every frame/event.
    heartbeat_interval = 15
    last_heartbeat = 0.0

    for det in detector.detect_source(source):

        # ---------------------------------------------------------
        # CAMERA HEARTBEAT
        # ---------------------------------------------------------
        now_monotonic = time.monotonic()

        if now_monotonic - last_heartbeat >= heartbeat_interval:
            try:
                with Session(engine) as session:
                    camera_row = session.get(Camera, camera_id)

                    if camera_row:
                        camera_row.last_seen_at = datetime.utcnow()
                        session.add(camera_row)
                        session.commit()

                        print(
                            f"heartbeat updated for camera "
                            f"{camera_row.name} ({camera_id})"
                        )

                        # FIXED (was a real gap - see the comment on
                        # PATCH /cameras/{id}/active in api/cameras.py):
                        # that endpoint only ever flipped the DB flag and
                        # explicitly said it "does not confirm it stops
                        # the actual tracking_runner process" - because
                        # nothing in this loop ever checked it. The
                        # heartbeat was already re-fetching this row
                        # every 15s regardless, so this reuses that same
                        # query instead of adding a new one - if the
                        # camera has been deactivated since this process
                        # started, stop pushing events and exit cleanly
                        # rather than silently continuing to burn
                        # CPU/GPU and write to Redis for a camera an
                        # operator just turned off.
                        if not camera_row.is_active:
                            print(
                                f"Camera {camera_row.name} ({camera_id}) was "
                                f"deactivated (is_active=False) - stopping."
                            )
                            break
                    else:
                        print(
                            f"Camera {camera_id} no longer exists in database."
                        )
                        break

                last_heartbeat = now_monotonic

            except Exception as exc:
                # Heartbeat failure must not stop the tracking pipeline.
                print(f"WARNING: camera heartbeat failed: {exc}")

        # ---------------------------------------------------------
        # EXISTING REDIS TRACKING EVENT
        # ---------------------------------------------------------
        entry_id = push_tracking_event(det)
        pushed += 1

        if pushed % 25 == 0:
            print(
                f"pushed {pushed} events "
                f"(latest Redis entry id: {entry_id})"
            )

    print(
        f"done - pushed {pushed} events total "
        f"for camera {camera.name} ({camera_id})"
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("camera_id", type=str, help="Camera row UUID")
    parser.add_argument(
        "--product",
        action="store_true",
        help="Use ProductDetector (DeepSORT) instead of PersonDetector (ByteTrack)",
    )
    parser.add_argument(
        "--max-age",
        type=int,
        default=30,
        help="DeepSORT max_age (frames a track survives with no matching "
             "detection before being dropped). Only used with --product. "
             "DeepSORT's own default is 30 - raise this if items are "
             "losing their track ID across occlusion/panning gaps longer "
             "than ~1 second at your video's FPS.",
    )
    parser.add_argument(
        "--tracker",
        type=str,
        default=None,
        help="Optional path to a custom ByteTrack config yaml, for PersonDetector "
             "only. Per-camera override - only use on cameras you've validated "
             "this config against (see tune_person_tracker.py). Defaults to "
             "PersonDetector's own safe default if omitted.",
    )
    args = parser.parse_args()
    run(
        uuid.UUID(args.camera_id),
        use_product_detector=args.product,
        max_age=args.max_age,
        tracker=args.tracker,
    )
