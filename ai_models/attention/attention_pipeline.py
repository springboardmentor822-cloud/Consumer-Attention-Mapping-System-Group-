"""
Combines head pose -> gaze-to-shelf mapping -> sustained attention
tracking, and pushes real AttentionEvent rows to the backend when a
person holds attention on a shelf for long enough.

Input: per-frame (session_id, floor_x, floor_y, head_yaw_degrees,
timestamp) tuples - in production these come from pairing
DetectionPipeline's tracked floor positions with
MediaPipeFaceLandmarker + estimate_head_pose() run on the same frame's
face crop. That pairing (matching a tracked body to its face) plus real
landmark extraction needs the blocked MediaPipe model file (see
head_pose.py), so it isn't wired into detection/pipeline.py directly.
What IS fully wired and tested here is everything downstream of having a
head yaw value: gaze-to-shelf geometry, sustained-attention state
tracking, and the real backend push.

Usage:
    pipeline = AttentionPipeline(
        camera_id=1, camera_mount_angle_degrees=90,
        shelves=[ShelfTarget(shelf_id=5, floor_x=3.0, floor_y=2.0)],
        backend=BackendClient(...),
    )
    pipeline.process(session_id=1, floor_x=1.0, floor_y=2.0, head_yaw=-15, timestamp=time.time())
    ...
    pipeline.end_session(session_id=1)  # flush any still-active attention
"""
from __future__ import annotations

import logging
import sys
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from ai_models.attention.gaze_mapping import (  # noqa: E402
    ShelfTarget,
    SustainedAttentionTracker,
    estimate_gaze_target,
    yaw_to_facing_angle,
)

logger = logging.getLogger("attention_pipeline")


class AttentionPipeline:
    def __init__(
        self,
        camera_id: int,
        camera_mount_angle_degrees: float,
        shelves: list[ShelfTarget],
        backend=None,  # ai_models.detection.pipeline.BackendClient, duck-typed to avoid a hard import cycle
        dry_run: bool = False,
        min_duration_seconds: float = 1.0,
        gap_tolerance_seconds: float = 1.5,
        max_angle_deviation: float = 30.0,
        max_distance_m: float = 6.0,
    ):
        self.camera_id = camera_id
        self.camera_mount_angle_degrees = camera_mount_angle_degrees
        self.shelves = shelves
        self.backend = backend
        self.dry_run = dry_run
        self.max_angle_deviation = max_angle_deviation
        self.max_distance_m = max_distance_m
        self.tracker = SustainedAttentionTracker(
            min_duration_seconds=min_duration_seconds, gap_tolerance_seconds=gap_tolerance_seconds
        )

    def process(
        self,
        session_id: int,
        floor_x: float,
        floor_y: float,
        head_yaw: float,
        timestamp: float,
        head_pitch: Optional[float] = None,
        head_roll: Optional[float] = None,
    ) -> None:
        facing_angle = yaw_to_facing_angle(head_yaw, self.camera_mount_angle_degrees)
        gaze = estimate_gaze_target(
            floor_x,
            floor_y,
            facing_angle,
            self.shelves,
            max_angle_deviation=self.max_angle_deviation,
            max_distance_m=self.max_distance_m,
        )

        emitted = self.tracker.update(str(session_id), timestamp, gaze)
        if emitted is not None:
            self._push_event(session_id, emitted, head_yaw, head_pitch, head_roll)

    def end_session(self, session_id: int, head_yaw: float = 0.0, head_pitch=None, head_roll=None) -> None:
        emitted = self.tracker.flush(str(session_id))
        if emitted is not None:
            self._push_event(session_id, emitted, head_yaw, head_pitch, head_roll)

    def _push_event(self, session_id: int, emitted, head_yaw, head_pitch, head_roll) -> None:
        import datetime as dt

        start = dt.datetime.fromtimestamp(emitted.start_timestamp, tz=dt.timezone.utc).replace(tzinfo=None)
        end = dt.datetime.fromtimestamp(emitted.end_timestamp, tz=dt.timezone.utc).replace(tzinfo=None)

        if self.dry_run or self.backend is None:
            logger.info(
                "[dry-run] AttentionEvent session=%d shelf=%d duration=%.1fs repeat=%s",
                session_id,
                emitted.shelf_id,
                emitted.duration_seconds,
                emitted.is_repeat,
            )
            return

        self.backend.create_attention_event(
            session_id=session_id,
            shelf_id=emitted.shelf_id,
            camera_id=self.camera_id,
            start_time=start,
            end_time=end,
            duration_seconds=emitted.duration_seconds,
            head_pose_yaw=head_yaw,
            head_pose_pitch=head_pitch,
            head_pose_roll=head_roll,
        )
        logger.info(
            "Pushed AttentionEvent session=%d shelf=%d duration=%.1fs repeat=%s",
            session_id,
            emitted.shelf_id,
            emitted.duration_seconds,
            emitted.is_repeat,
        )
