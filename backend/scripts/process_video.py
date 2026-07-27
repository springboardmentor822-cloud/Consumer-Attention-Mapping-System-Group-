"""Stream real YOLO+ByteTrack observations into the tracking ingestion API."""

from __future__ import annotations

import argparse
import json
import math
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable, Iterable

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.ml.errors import MLConfigurationError, MLError  # noqa: E402
from app.ml.inference import Detection, YOLOByteTracker  # noqa: E402
from app.ml.video import VideoFrame, VideoFrameIterator  # noqa: E402

MAX_INGEST_BATCH = 100
DEFAULT_TOKEN_ENV = "ATTENTION_API_TOKEN"


class APIIngestError(RuntimeError):
    """The API did not confirm the submitted observation batch."""


class WorkerRunError(RuntimeError):
    """A worker run failed after collecting a truthful partial summary."""

    def __init__(self, message: str, summary: dict[str, Any]):
        super().__init__(message)
        self.summary = summary


@dataclass(frozen=True)
class WorkerConfig:
    source: str | int
    model: str
    store_id: int
    camera_id: int
    zone_id: int | None
    api_base: str
    token: str
    frame_stride: int = 1
    max_frames: int | None = None
    device: str | int | None = None
    confidence: float = 0.25
    classes: tuple[int, ...] = (0,)
    http_timeout_seconds: float = 15.0

    def __post_init__(self) -> None:
        if self.store_id < 1 or self.camera_id < 1:
            raise MLConfigurationError("store-id and camera-id must be positive integers.")
        if self.zone_id is not None and self.zone_id < 1:
            raise MLConfigurationError("zone-id must be positive when supplied.")
        if not self.model.strip():
            raise MLConfigurationError("model cannot be empty.")
        model_path = Path(self.model).expanduser()
        if (model_path.is_absolute() or len(model_path.parts) > 1) and not model_path.is_file():
            raise FileNotFoundError(f"Model checkpoint/configuration does not exist: {model_path.resolve()}")
        if self.frame_stride < 1:
            raise MLConfigurationError("frame-stride must be at least 1.")
        if self.max_frames is not None and self.max_frames < 1:
            raise MLConfigurationError("max-frames must be positive when supplied.")
        if not 0.0 <= self.confidence <= 1.0:
            raise MLConfigurationError("confidence must be in [0, 1].")
        if not self.classes or any(class_id < 0 for class_id in self.classes):
            raise MLConfigurationError("classes must contain one or more non-negative IDs.")
        if self.http_timeout_seconds <= 0:
            raise MLConfigurationError("HTTP timeout must be positive.")
        if not self.token.strip() or any(character in self.token for character in "\r\n"):
            raise MLConfigurationError("A non-empty Bearer token without line breaks is required.")
        parsed = urllib.parse.urlparse(self.api_base)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise MLConfigurationError("api-base must be an absolute http:// or https:// URL.")


@dataclass
class WorkerStats:
    frames_decoded: int = 0
    frames: int = 0
    detections: int = 0
    observations_prepared: int = 0
    skipped_untracked: int = 0
    accepted: int = 0
    failed: int = 0
    batches_attempted: int = 0
    batches_succeeded: int = 0
    elapsed_seconds: float = 0.0

    def to_dict(self, *, status: str, error: str | None = None) -> dict[str, Any]:
        fps = self.frames / self.elapsed_seconds if self.elapsed_seconds > 0 else 0.0
        return {
            "status": status,
            "frames_decoded": self.frames_decoded,
            "frames": self.frames,
            "fps": round(fps, 3),
            "elapsed_seconds": round(self.elapsed_seconds, 6),
            "detections": self.detections,
            "observations_prepared": self.observations_prepared,
            "skipped_untracked": self.skipped_untracked,
            "accepted": self.accepted,
            "failed": self.failed,
            "batches_attempted": self.batches_attempted,
            "batches_succeeded": self.batches_succeeded,
            "error": error,
        }


class TrackingIngestClient:
    """Minimal JSON client using the Python standard library."""

    def __init__(
        self,
        api_base: str,
        token: str,
        *,
        timeout_seconds: float = 15.0,
        opener: Callable[..., Any] | None = None,
    ):
        self.api_base = api_base.rstrip("/")
        self.token = token
        self.timeout_seconds = timeout_seconds
        self._opener = opener or urllib.request.urlopen

    def post_batch(self, store_id: int, observations: list[dict[str, Any]]) -> dict[str, Any]:
        if not 1 <= len(observations) <= MAX_INGEST_BATCH:
            raise MLConfigurationError(f"Ingest batches must contain 1..{MAX_INGEST_BATCH} observations.")
        url = f"{self.api_base}/stores/{store_id}/tracking/ingest"
        body = json.dumps(
            {"store_id": store_id, "observations": observations},
            separators=(",", ":"),
        ).encode("utf-8")
        request = urllib.request.Request(
            url,
            data=body,
            method="POST",
            headers={
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json",
                "Accept": "application/json",
                "User-Agent": "attention-mapping-video-worker/1",
            },
        )
        try:
            with self._opener(request, timeout=self.timeout_seconds) as response:
                response_bytes = response.read()
                status = int(getattr(response, "status", 200))
        except urllib.error.HTTPError as exc:
            response_body = exc.read().decode("utf-8", errors="replace")[:2000]
            raise APIIngestError(f"Tracking ingest returned HTTP {exc.code}: {response_body}") from exc
        except urllib.error.URLError as exc:
            raise APIIngestError(f"Tracking ingest request failed: {exc.reason}") from exc
        except TimeoutError as exc:
            raise APIIngestError(f"Tracking ingest timed out after {self.timeout_seconds:g}s.") from exc
        except OSError as exc:
            raise APIIngestError(f"Tracking ingest connection failed: {exc}") from exc

        if not 200 <= status < 300:
            raise APIIngestError(f"Tracking ingest returned unexpected HTTP status {status}.")
        try:
            payload = json.loads(response_bytes.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError) as exc:
            raise APIIngestError("Tracking ingest returned a non-JSON response.") from exc
        if not isinstance(payload, dict):
            raise APIIngestError("Tracking ingest response must be a JSON object.")
        if payload.get("store_id") != store_id:
            raise APIIngestError("Tracking ingest response store_id does not match the request.")
        accepted = payload.get("accepted")
        if isinstance(accepted, bool) or not isinstance(accepted, int) or not 0 <= accepted <= len(observations):
            raise APIIngestError("Tracking ingest response contains an invalid accepted count.")
        message_ids = payload.get("message_ids")
        if not isinstance(message_ids, list) or len(message_ids) != accepted:
            raise APIIngestError("Tracking ingest response message_ids do not match the accepted count.")
        return payload


def normalize_detection(
    detection: Detection,
    *,
    frame_width: int,
    frame_height: int,
    camera_id: int,
    zone_id: int | None,
    frame_index: int,
    observed_at: str,
) -> dict[str, Any] | None:
    """Convert a real tracked pixel box to the API's normalized 0..100 schema."""

    if detection.track_id is None:
        return None
    if frame_width < 1 or frame_height < 1:
        raise MLConfigurationError("Tracker returned a frame with invalid dimensions.")
    x1, y1, x2, y2 = detection.bbox_xyxy
    values = (x1, y1, x2, y2, detection.confidence)
    if not all(math.isfinite(value) for value in values):
        raise MLConfigurationError("Tracker returned non-finite detection values.")
    if x2 < x1 or y2 < y1:
        raise MLConfigurationError("Tracker returned an inverted bounding box.")

    def x_percent(value: float) -> float:
        return min(100.0, max(0.0, value * 100.0 / frame_width))

    def y_percent(value: float) -> float:
        return min(100.0, max(0.0, value * 100.0 / frame_height))

    bbox_x1 = x_percent(x1)
    bbox_y1 = y_percent(y1)
    bbox_x2 = x_percent(x2)
    bbox_y2 = y_percent(y2)
    return {
        "tracker_id": f"camera:{camera_id}:track:{detection.track_id}",
        "camera_feed_id": camera_id,
        "zone_id": zone_id,
        "observed_at": observed_at,
        "frame_index": frame_index,
        "x_position": (bbox_x1 + bbox_x2) / 2.0,
        "y_position": (bbox_y1 + bbox_y2) / 2.0,
        "bbox_x1": bbox_x1,
        "bbox_y1": bbox_y1,
        "bbox_x2": bbox_x2,
        "bbox_y2": bbox_y2,
        "confidence": min(1.0, max(0.0, float(detection.confidence))),
        "gaze_yaw_degrees": None,
        "attention_probability": None,
        "source": "yolo-bytetrack",
    }


def run_worker(
    config: WorkerConfig,
    *,
    frames: Iterable[VideoFrame] | None = None,
    tracker: YOLOByteTracker | Any | None = None,
    client: TrackingIngestClient | Any | None = None,
    monotonic: Callable[[], float] = time.monotonic,
    utcnow: Callable[[], datetime] | None = None,
) -> dict[str, Any]:
    """Process frames and synchronously confirm every posted observation batch."""

    stats = WorkerStats()
    started = monotonic()
    pending: list[dict[str, Any]] = []
    now = utcnow or (lambda: datetime.now(timezone.utc))

    if frames is None:
        frames = VideoFrameIterator(
            config.source,
            stride=config.frame_stride,
            max_frames=config.max_frames,
        )
    if tracker is None:
        tracker = YOLOByteTracker(
            config.model,
            confidence_threshold=config.confidence,
            classes=config.classes,
            device=config.device,
        )
    if client is None:
        client = TrackingIngestClient(
            config.api_base,
            config.token,
            timeout_seconds=config.http_timeout_seconds,
        )

    def flush() -> None:
        if not pending:
            return
        batch = list(pending)
        pending.clear()
        stats.batches_attempted += 1
        try:
            response = client.post_batch(config.store_id, batch)
            accepted = int(response["accepted"])
            stats.accepted += accepted
            unconfirmed = len(batch) - accepted
            stats.failed += unconfirmed
            if unconfirmed:
                raise APIIngestError(f"Tracking API accepted only {accepted} of {len(batch)} observations.")
            stats.batches_succeeded += 1
        except Exception:
            if stats.accepted + stats.failed < stats.observations_prepared:
                stats.failed += len(batch)
            raise

    try:
        for frame in frames:
            stats.frames_decoded += 1
            tracked = tracker.process_frame(
                frame.image,
                timestamp_seconds=frame.timestamp_seconds,
                frame_index=frame.source_index,
            )
            stats.frames += 1
            stats.detections += len(tracked.detections)
            shape = getattr(frame.image, "shape", None)
            if shape is None or len(shape) < 2:
                raise MLConfigurationError("Decoded frame does not expose image height and width.")
            frame_height, frame_width = int(shape[0]), int(shape[1])
            observed_timestamp = now()
            if observed_timestamp.tzinfo is None:
                observed_timestamp = observed_timestamp.replace(tzinfo=timezone.utc)
            observed_at = observed_timestamp.astimezone(timezone.utc).isoformat()
            for detection in tracked.detections:
                observation = normalize_detection(
                    detection,
                    frame_width=frame_width,
                    frame_height=frame_height,
                    camera_id=config.camera_id,
                    zone_id=config.zone_id,
                    frame_index=frame.source_index,
                    observed_at=observed_at,
                )
                if observation is None:
                    stats.skipped_untracked += 1
                    continue
                pending.append(observation)
                stats.observations_prepared += 1
                if len(pending) == MAX_INGEST_BATCH:
                    flush()
        flush()
        if stats.frames_decoded == 0:
            raise MLConfigurationError("Video/RTSP source produced no decodable frames.")
    except Exception as exc:
        stats.elapsed_seconds = max(0.0, monotonic() - started)
        if pending:
            stats.failed += len(pending)
            pending.clear()
        summary = stats.to_dict(status="failed", error=str(exc))
        raise WorkerRunError(str(exc), summary) from exc

    stats.elapsed_seconds = max(0.0, monotonic() - started)
    return stats.to_dict(status="completed")


def parse_classes(value: str) -> tuple[int, ...]:
    try:
        parsed = tuple(dict.fromkeys(int(token.strip()) for token in value.split(",") if token.strip()))
    except ValueError as exc:
        raise argparse.ArgumentTypeError("classes must be comma-separated non-negative integers") from exc
    if not parsed or any(class_id < 0 for class_id in parsed):
        raise argparse.ArgumentTypeError("classes must contain comma-separated non-negative integers")
    return parsed


def resolve_token(explicit_token: str | None, token_env: str) -> str:
    token = explicit_token if explicit_token is not None else os.getenv(token_env)
    if token is None or not token.strip():
        raise MLConfigurationError(
            f"No API token supplied. Pass --token or set the environment variable {token_env}."
        )
    return token.strip()


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Run YOLO+ByteTrack over a video/RTSP source and ingest only real tracked observations.",
    )
    parser.add_argument("video", help="Local video path or RTSP/HTTP stream URL.")
    parser.add_argument("--model", required=True, help="Local checkpoint or Ultralytics model reference.")
    parser.add_argument("--store-id", type=int, required=True)
    parser.add_argument("--camera-id", type=int, required=True)
    parser.add_argument("--zone-id", type=int)
    parser.add_argument("--api-base", default="http://127.0.0.1:8000/api")
    token_group = parser.add_mutually_exclusive_group()
    token_group.add_argument("--token", help="Bearer token; prefer --token-env to avoid shell history.")
    token_group.add_argument("--token-env", default=DEFAULT_TOKEN_ENV, help="Environment variable containing the token.")
    parser.add_argument("--frame-stride", "--stride", type=int, default=1)
    parser.add_argument("--max-frames", type=int)
    parser.add_argument("--device", help="Ultralytics device, for example cpu or 0.")
    parser.add_argument("--confidence", type=float, default=0.25)
    parser.add_argument("--classes", type=parse_classes, default=(0,), help="Comma-separated model class IDs; default: 0.")
    parser.add_argument("--http-timeout", type=float, default=15.0)
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        token = resolve_token(args.token, args.token_env)
        config = WorkerConfig(
            source=args.video,
            model=args.model,
            store_id=args.store_id,
            camera_id=args.camera_id,
            zone_id=args.zone_id,
            api_base=args.api_base,
            token=token,
            frame_stride=args.frame_stride,
            max_frames=args.max_frames,
            device=args.device,
            confidence=args.confidence,
            classes=args.classes,
            http_timeout_seconds=args.http_timeout,
        )
        summary = run_worker(config)
    except WorkerRunError as exc:
        print(json.dumps(exc.summary, indent=2, sort_keys=True), file=sys.stderr)
        return 1
    except (MLError, FileNotFoundError, ValueError) as exc:
        print(json.dumps({"status": "failed", "error": str(exc)}, indent=2), file=sys.stderr)
        return 2
    except KeyboardInterrupt:
        print(json.dumps({"status": "failed", "error": "Interrupted by user."}, indent=2), file=sys.stderr)
        return 130

    print(json.dumps(summary, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
