"""
Wires video_intake -> a person detector -> a tracker -> the backend's
ingest APIs (/sessions, /tracking/batch), managing shopper session
lifecycle (create on first sighting of a track, close on disappearance).

Usage:

    # Dry run (prints what it would send, no backend needed) - good for
    # sanity-checking the detector/tracker on a sample video:
    python pipeline.py --source ../video_intake/sample_data/vtest.avi --dry-run

    # Real run against a live backend:
    python pipeline.py --source rtsp://... --camera-id 1 --store-id 1 \
        --backend-url http://localhost:8000/api/v1 \
        --email admin@example.com --password Admin123!

Detector selection: HOG by default (works with no external downloads,
see detector.py for why). Pass --detector yolov8 to use the production
YOLOv8+ByteTrack path once you have real weights available.
"""
from __future__ import annotations

import argparse
import datetime as dt
import logging
import sys
import uuid
from pathlib import Path
from typing import Optional

import requests

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from ai_models.attention.attention_pipeline import AttentionPipeline  # noqa: E402
from ai_models.attention.face_pose_estimator import FacePoseEstimator, crop_head_region  # noqa: E402
from ai_models.calibration.homography import CameraCalibration, foot_point  # noqa: E402
from ai_models.detection.detector import Detection, HOGPersonDetector, YOLOv8Detector  # noqa: E402
from ai_models.detection.tracker import CentroidTracker  # noqa: E402
from ai_models.video_intake.intake import IntakeConfig, VideoIntake  # noqa: E402

logger = logging.getLogger("detection_pipeline")


class BackendClient:
    """Thin wrapper over the backend REST API used by the pipeline."""

    def __init__(self, base_url: str, email: str, password: str):
        self.base_url = base_url.rstrip("/")
        self._token: Optional[str] = None
        self._login(email, password)

    def _login(self, email: str, password: str) -> None:
        resp = requests.post(
            f"{self.base_url}/auth/login",
            data={"username": email, "password": password},
        )
        resp.raise_for_status()
        self._token = resp.json()["access_token"]
        logger.info("Authenticated with backend as %s", email)

    def _headers(self) -> dict:
        return {"Authorization": f"Bearer {self._token}"}

    def create_session(self, store_id: int, shopper_uid: str, entry_time: dt.datetime) -> int:
        resp = requests.post(
            f"{self.base_url}/sessions",
            json={
                "store_id": store_id,
                "shopper_uid": shopper_uid,
                "entry_time": entry_time.isoformat(),
            },
            headers=self._headers(),
        )
        resp.raise_for_status()
        return resp.json()["id"]

    def close_session(self, session_id: int, exit_time: dt.datetime) -> None:
        resp = requests.put(
            f"{self.base_url}/sessions/{session_id}",
            json={"exit_time": exit_time.isoformat()},
            headers=self._headers(),
        )
        resp.raise_for_status()

    def push_tracking_batch(self, points: list[dict]) -> None:
        if not points:
            return
        resp = requests.post(
            f"{self.base_url}/tracking/batch", json=points, headers=self._headers()
        )
        resp.raise_for_status()

    def get_camera_calibration(self, camera_id: int) -> Optional["CameraCalibration"]:
        resp = requests.get(f"{self.base_url}/cameras/{camera_id}", headers=self._headers())
        resp.raise_for_status()
        calibration_data = resp.json().get("calibration_data")
        if not calibration_data:
            return None
        try:
            return CameraCalibration.from_json(calibration_data)
        except (ValueError, KeyError) as exc:
            logger.warning("Camera %d has invalid calibration_data, ignoring: %s", camera_id, exc)
            return None

    def get_shelves(self, store_id: int) -> list[dict]:
        resp = requests.get(
            f"{self.base_url}/shelves", params={"store_id": store_id}, headers=self._headers()
        )
        resp.raise_for_status()
        return resp.json()

    def create_attention_event(
        self,
        session_id: int,
        shelf_id: int,
        camera_id: int,
        start_time,
        end_time,
        duration_seconds: float,
        head_pose_yaw: Optional[float] = None,
        head_pose_pitch: Optional[float] = None,
        head_pose_roll: Optional[float] = None,
        product_id: Optional[int] = None,
    ) -> int:
        payload = {
            "session_id": session_id,
            "shelf_id": shelf_id,
            "product_id": product_id,
            "camera_id": camera_id,
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat(),
            "duration_seconds": duration_seconds,
            "head_pose_yaw": head_pose_yaw,
            "head_pose_pitch": head_pose_pitch,
            "head_pose_roll": head_pose_roll,
        }
        resp = requests.post(f"{self.base_url}/attention/events", json=payload, headers=self._headers())
        resp.raise_for_status()
        return resp.json()["id"]


class DetectionPipeline:
    def __init__(
        self,
        camera_id: int,
        store_id: int,
        detector,
        backend: Optional[BackendClient] = None,
        dry_run: bool = False,
        max_disappeared_frames: int = 10,
        attention_pipeline: Optional[AttentionPipeline] = None,
        face_pose_estimator: Optional[FacePoseEstimator] = None,
    ):
        self.camera_id = camera_id
        self.store_id = store_id
        self.detector = detector
        self.backend = backend
        self.dry_run = dry_run
        self.tracker = CentroidTracker(max_disappeared=max_disappeared_frames)
        self.attention_pipeline = attention_pipeline
        self.face_pose_estimator = face_pose_estimator

        self.calibration: Optional[CameraCalibration] = None
        if backend is not None and not dry_run:
            self.calibration = backend.get_camera_calibration(camera_id)
            if self.calibration:
                logger.info("Loaded floor calibration for camera %d - tracking points will include floor_x/floor_y.", camera_id)
            else:
                logger.info("No calibration set for camera %d - tracking points will only have pixel coordinates.", camera_id)

        if self.attention_pipeline is not None and self.face_pose_estimator is not None and self.calibration is None:
            logger.warning(
                "Attention pipeline is configured but camera %d has no calibration - "
                "gaze-to-shelf mapping needs floor coordinates, so attention events will be skipped.",
                camera_id,
            )

        # track_id -> backend session_id, and last-seen bookkeeping
        self._track_sessions: dict[int, int] = {}
        self._known_track_ids: set[int] = set()

    def _use_native_tracking(self) -> bool:
        return isinstance(self.detector, YOLOv8Detector)

    def on_frame(self, frame, index: int, timestamp: float) -> None:
        now = dt.datetime.fromtimestamp(timestamp, tz=dt.timezone.utc).replace(tzinfo=None)

        if self._use_native_tracking():
            tracked = self.detector.track(frame)  # [(Detection, track_id), ...]
            active: dict[int, Detection] = {tid: det for det, tid in tracked}
        else:
            detections = self.detector.detect(frame)
            active = self.tracker.update(detections)

        current_ids = set(active.keys())
        new_ids = current_ids - self._known_track_ids
        gone_ids = self._known_track_ids - current_ids

        for tid in new_ids:
            shopper_uid = f"cam{self.camera_id}-track{tid}-{uuid.uuid4().hex[:6]}"
            if self.dry_run or self.backend is None:
                logger.info("[dry-run] new session for track_id=%d (shopper_uid=%s)", tid, shopper_uid)
                self._track_sessions[tid] = -tid  # placeholder id
            else:
                session_id = self.backend.create_session(self.store_id, shopper_uid, now)
                self._track_sessions[tid] = session_id
                logger.info("Created session %d for track_id=%d", session_id, tid)

        for tid in gone_ids:
            session_id = self._track_sessions.pop(tid, None)
            if session_id is None:
                continue
            if self.dry_run or self.backend is None:
                logger.info("[dry-run] closing session for track_id=%d", tid)
            else:
                self.backend.close_session(session_id, now)
                logger.info("Closed session %d for track_id=%d", session_id, tid)
            if self.attention_pipeline is not None:
                self.attention_pipeline.end_session(session_id)

        self._known_track_ids = current_ids

        points = []
        for tid, det in active.items():
            session_id = self._track_sessions.get(tid)
            if session_id is None or session_id < 0:
                continue

            floor_x, floor_y = None, None
            if self.calibration is not None:
                fx, fy = foot_point(det.x, det.y, det.w, det.h)
                floor_x, floor_y = self.calibration.pixel_to_floor(fx, fy)

            if (
                self.attention_pipeline is not None
                and self.face_pose_estimator is not None
                and floor_x is not None
                and floor_y is not None
            ):
                head_crop = crop_head_region(frame, det.x, det.y, det.w, det.h)
                pose = self.face_pose_estimator.estimate(head_crop)
                if pose is not None:
                    self.attention_pipeline.process(
                        session_id=session_id,
                        floor_x=floor_x,
                        floor_y=floor_y,
                        head_yaw=pose.yaw,
                        timestamp=timestamp,
                        head_pitch=pose.pitch,
                        head_roll=pose.roll,
                    )

            points.append(
                {
                    "session_id": session_id,
                    "camera_id": self.camera_id,
                    "timestamp": now.isoformat(),
                    "bbox_x": det.x,
                    "bbox_y": det.y,
                    "bbox_w": det.w,
                    "bbox_h": det.h,
                    "detection_confidence": det.confidence,
                    "floor_x": floor_x,
                    "floor_y": floor_y,
                    "track_id": tid,
                }
            )

        if self.dry_run or self.backend is None:
            if active:
                logger.info(
                    "[dry-run] frame %d: %d active track(s): %s",
                    index,
                    len(active),
                    {tid: (round(d.x), round(d.y)) for tid, d in active.items()},
                )
        elif points:
            self.backend.push_tracking_batch(points)


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Run detection+tracking on a video source.")
    parser.add_argument("--source", required=True, help="Webcam index, file path, or RTSP URL.")
    parser.add_argument("--target-fps", type=float, default=5.0)
    parser.add_argument("--detector", choices=["hog", "yolov8"], default="hog")
    parser.add_argument("--yolo-weights", default="yolov8n.pt")
    parser.add_argument("--camera-id", type=int, default=1)
    parser.add_argument("--store-id", type=int, default=1)
    parser.add_argument("--backend-url", default=None)
    parser.add_argument("--email", default=None)
    parser.add_argument("--password", default=None)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--max-frames", type=int, default=None)
    parser.add_argument("--verbose", action="store_true")
    parser.add_argument(
        "--enable-attention",
        action="store_true",
        help="Also run head-pose -> gaze-to-shelf estimation on each tracked person "
        "(requires camera calibration to be set; uses a synthetic stand-in pose "
        "estimator unless --face-model-path points at a real face_landmarker.task).",
    )
    parser.add_argument("--camera-mount-angle", type=float, default=0.0, help="Camera's optical-axis direction in the store's floor coordinate system, degrees.")
    parser.add_argument("--face-model-path", default=None, help="Path to a real face_landmarker.task file. If omitted, uses the synthetic stand-in (see attention module README).")
    return parser


def main() -> None:
    args = build_arg_parser().parse_args()
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
    )

    if args.detector == "hog":
        detector = HOGPersonDetector()
    else:
        detector = YOLOv8Detector(weights_path=args.yolo_weights)

    dry_run = args.dry_run or not args.backend_url
    backend = None
    if not dry_run:
        backend = BackendClient(args.backend_url, args.email, args.password)

    attention_pipeline = None
    face_pose_estimator = None
    if args.enable_attention:
        from ai_models.attention.attention_pipeline import AttentionPipeline
        from ai_models.attention.face_pose_estimator import (
            MediaPipeFacePoseEstimator,
            SyntheticFacePoseEstimator,
        )
        from ai_models.attention.gaze_mapping import ShelfTarget

        shelves = []
        if backend is not None:
            for shelf in backend.get_shelves(args.store_id):
                centroid = _shelf_centroid(shelf.get("position_coordinates"))
                if centroid is not None:
                    shelves.append(ShelfTarget(shelf_id=shelf["id"], floor_x=centroid[0], floor_y=centroid[1]))
            if not shelves:
                logger.warning(
                    "--enable-attention was set but no shelves with position_coordinates were "
                    "found for store %d - no shelf can ever be matched. Set shelf floor positions first.",
                    args.store_id,
                )

        attention_pipeline = AttentionPipeline(
            camera_id=args.camera_id,
            camera_mount_angle_degrees=args.camera_mount_angle,
            shelves=shelves,
            backend=backend,
            dry_run=dry_run,
        )

        if args.face_model_path:
            face_pose_estimator = MediaPipeFacePoseEstimator(model_path=args.face_model_path)
        else:
            logger.info(
                "No --face-model-path given: using SyntheticFacePoseEstimator (integration "
                "test stand-in, NOT real face detection - see ai_models/attention/README.md)."
            )
            face_pose_estimator = SyntheticFacePoseEstimator()

    pipeline = DetectionPipeline(
        camera_id=args.camera_id,
        store_id=args.store_id,
        detector=detector,
        backend=backend,
        dry_run=dry_run,
        attention_pipeline=attention_pipeline,
        face_pose_estimator=face_pose_estimator,
    )

    intake = VideoIntake(IntakeConfig(source=args.source, target_fps=args.target_fps))
    intake.run(on_frame=pipeline.on_frame, max_frames=args.max_frames)


def _shelf_centroid(position_coordinates_json: Optional[str]) -> Optional[tuple[float, float]]:
    """position_coordinates is a JSON-encoded polygon, e.g. "[[0,0],[2,0],[2,1],[0,1]]".
    Returns its centroid as a single representative floor point, or None if unset/invalid."""
    if not position_coordinates_json:
        return None
    try:
        import json

        points = json.loads(position_coordinates_json)
        if not points:
            return None
        avg_x = sum(p[0] for p in points) / len(points)
        avg_y = sum(p[1] for p in points) / len(points)
        return (avg_x, avg_y)
    except (ValueError, TypeError, KeyError, IndexError):
        return None


if __name__ == "__main__":
    main()
