"""Live camera feed object and human tagging runner.

Supports laptop webcams (0, 1), mobile phone IP camera streams (HTTP/RTSP),
and pre-recorded videos. Performs real-time YOLO object detection, persistent
ByteTrack tracking/tagging, live OpenCV HUD preview overlay, and ingest into the
backend attention mapping database.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.ml.inference import YOLOByteTracker  # noqa: E402
from app.ml.optional import require_module  # noqa: E402
from app.ml.video import VideoFrameIterator  # noqa: E402


def _get_demo_token(api_base: str) -> str:
    """Fetch an authentication token using seeded Analyst credentials if needed."""
    auth_url = f"{api_base.rstrip('/')}/auth/login"
    payload = json.dumps({"email": "analyst@attention.ai", "password": "Analyst@123"}).encode("utf-8")
    req = urllib.request.Request(auth_url, data=payload, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=5.0) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data["access_token"]
    except Exception as exc:
        print(f"Warning: Could not auto-authenticate demo user ({exc}). Token must be supplied manually.")
        return ""


def post_ingest_batch(api_base: str, store_id: int, token: str, payload: dict[str, Any], timeout: float = 10.0) -> bool:
    """Post an observation batch to the store-scoped ingest endpoint."""
    url = f"{api_base.rstrip('/')}/stores/{store_id}/tracking/ingest"
    body = json.dumps(payload).encode("utf-8")
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}",
    }
    req = urllib.request.Request(url, data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status == 200
    except Exception as exc:
        print(f"Ingest post warning: {exc}")
        return False


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Stream live camera feeds (laptop webcam or mobile phone IP camera) with real-time YOLO object & human tagging.",
    )
    parser.add_argument(
        "source",
        nargs="?",
        default="0",
        help="Camera source: webcam index (0, 1), mobile IP camera URL (http://192.168.x.x:8080/video or rtsp://...), or video path.",
    )
    parser.add_argument(
        "--model",
        default="ml_runs/retail_finetune/weights/best.pt",
        help="Path to YOLO weights or model checkpoint (default: fine-tuned retail_finetune model or yolov8n.pt).",
    )
    parser.add_argument("--store-id", type=int, default=1, help="Store ID for tracking ingest (default: 1).")
    parser.add_argument("--camera-id", type=int, default=1, help="Camera feed ID (default: 1).")
    parser.add_argument("--zone-id", type=int, default=1, help="Zone ID (default: 1).")
    parser.add_argument("--api-base", default="http://127.0.0.1:8000/api", help="FastAPI backend API base URL.")
    parser.add_argument("--token", help="Bearer access token (if omitted, auto-authenticates as analyst@attention.ai).")
    parser.add_argument("--confidence", type=float, default=0.25, help="Confidence threshold (default: 0.25).")
    parser.add_argument(
        "--classes",
        nargs="+",
        type=int,
        help="Numeric class IDs to track (e.g. 0 for person, or leave empty for all detected object classes).",
    )
    parser.add_argument("--device", help="Compute device for inference (cpu, 0, etc.).")
    parser.add_argument("--stride", type=int, default=1, help="Frame stride (default: 1 for smooth real-time tracking).")
    parser.add_argument("--show", action="store_true", help="Display real-time OpenCV HUD preview window with bounding boxes & tracker tags.")
    parser.add_argument("--no-show", action="store_false", dest="show", help="Disable HUD preview window.")
    parser.set_defaults(show=True)
    return parser


def run_live_stream(args: argparse.Namespace) -> int:
    source: str | int = args.source
    if str(source).strip().isdigit():
        source = int(str(source).strip())

    model_path = Path(args.model).expanduser()
    if not model_path.is_file() and not Path(args.model).is_absolute():
        fallback_path = BACKEND_ROOT / args.model
        if fallback_path.is_file():
            model_path = fallback_path
        elif Path("yolov8n.pt").is_file():
            print(f"Note: Custom model {args.model} not found. Using pretrained yolov8n.pt.")
            model_path = Path("yolov8n.pt")
        else:
            model_path = Path("yolov8n.pt")

    token = args.token or os.getenv("ATTENTION_API_TOKEN")
    if not token:
        print("Auto-authenticating with API demo user credentials...")
        token = _get_demo_token(args.api_base)

    print(f"\n--- Live Camera Feed Tagging System ---")
    print(f"Source       : {source} ({'Laptop Webcam' if isinstance(source, int) else 'Mobile/IP Stream'})")
    print(f"Model        : {model_path}")
    print(f"Store/Cam/Zone: Store #{args.store_id}, Camera #{args.camera_id}, Zone #{args.zone_id}")
    print(f"Classes      : {args.classes if args.classes else 'All Detected Classes (Humans & Objects)'}")
    print(f"HUD Preview  : {'ENABLED (Press `q` in HUD window to quit)' if args.show else 'DISABLED'}")
    print(f"API Ingest   : {args.api_base}")
    print("---------------------------------------\n")

    cv2 = require_module("cv2", purpose="Displaying HUD preview window and decoding live camera frames")
    
    classes_list = args.classes if args.classes else None
    tracker = YOLOByteTracker(
        model=model_path,
        confidence_threshold=args.confidence,
        classes=classes_list,
        device=args.device,
    )

    try:
        frame_iterator = VideoFrameIterator(source=source, stride=args.stride)
    except Exception as exc:
        print(f"Error opening camera source '{source}': {exc}")
        return 1

    frames_processed = 0
    detections_total = 0
    start_time = time.monotonic()

    print("Starting live tracking loop... Press Ctrl+C or 'q' in preview window to exit.")
    
    try:
        for frame in frame_iterator:
            frames_processed += 1
            tracked = tracker.process_frame(frame.image, timestamp_seconds=frame.timestamp_seconds, frame_index=frame.source_index)

            height, width = frame.original_shape[:2]
            observations = []
            now_iso = datetime.now(timezone.utc).isoformat()

            # Annotate frame for HUD display
            annotated_frame = frame.image.copy() if args.show else None

            for det in tracked.detections:
                detections_total += 1
                center_x, center_y = det.center_xy
                norm_x = max(0.0, min(1.0, center_x / width)) if width else 0.5
                norm_y = max(0.0, min(1.0, center_y / height)) if height else 0.5
                left, top, right, bottom = det.bbox_xyxy

                # Human/Shopper vs Object classification label
                is_human = (det.class_name == "person" or det.class_id == 0)
                tag_label = f"{'HUMAN' if is_human else det.class_name.upper()} #{det.track_id if det.track_id is not None else '?'}"

                obs = {
                    "camera_feed_id": args.camera_id,
                    "zone_id": args.zone_id,
                    "tracker_id": det.track_id if det.track_id is not None else (1000 + det.class_id),
                    "observed_at": now_iso,
                    "frame_index": frame.source_index,
                    "x_position": norm_x,
                    "y_position": norm_y,
                    "bbox_x_min": left / width if width else 0.0,
                    "bbox_y_min": top / height if height else 0.0,
                    "bbox_x_max": right / width if width else 1.0,
                    "bbox_y_max": bottom / height if height else 1.0,
                    "confidence": det.confidence,
                    "gaze_target": det.class_name,
                }
                observations.append(obs)

                if args.show and annotated_frame is not None:
                    # Draw bounding box (Teal for Humans, Amber for Objects)
                    color = (235, 190, 40) if is_human else (50, 200, 240)
                    cv2.rectangle(annotated_frame, (int(left), int(top)), (int(right), int(bottom)), color, 2)
                    
                    # Draw label background box
                    label_text = f"{tag_label} ({det.confidence:.2f})"
                    (w, h), _ = cv2.getTextSize(label_text, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
                    cv2.rectangle(annotated_frame, (int(left), int(top) - h - 6), (int(left) + w + 6, int(top)), color, -1)
                    cv2.putText(annotated_frame, label_text, (int(left) + 3, int(top) - 4), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1, cv2.LINE_AA)

            # Ingest observations to API
            if observations and token:
                payload = {
                    "store_id": args.store_id,
                    "observations": observations,
                }
                post_ingest_batch(args.api_base, args.store_id, token, payload)

            if args.show and annotated_frame is not None:
                elapsed = max(0.001, time.monotonic() - start_time)
                fps = frames_processed / elapsed
                cv2.putText(
                    annotated_frame,
                    f"LIVE FEED - Cam #{args.camera_id} | FPS: {fps:.1f} | Frame: {frame.source_index} | Tags: {len(tracked.detections)}",
                    (10, 25),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.6,
                    (0, 255, 0),
                    2,
                    cv2.LINE_AA,
                )
                cv2.imshow("Attention Mapping - Live Camera Object & Human Tagging", annotated_frame)
                key = cv2.waitKey(1) & 0xFF
                if key == ord('q') or key == 27:
                    print("\nExiting live HUD preview window...")
                    break

            if frames_processed % 30 == 0:
                elapsed = time.monotonic() - start_time
                print(f"Live Stream Status: {frames_processed} frames processed | {detections_total} tagged detections | {frames_processed/elapsed:.1f} FPS")

    except KeyboardInterrupt:
        print("\nLive camera stream stopped by user.")
    finally:
        if args.show:
            try:
                cv2.destroyAllWindows()
            except Exception:
                pass
        elapsed = max(0.001, time.monotonic() - start_time)
        print(f"\nFinal Summary: {frames_processed} frames processed in {elapsed:.2f}s ({frames_processed/elapsed:.1f} FPS). Total tagged detections: {detections_total}.")

    return 0


if __name__ == "__main__":
    raise SystemExit(run_live_stream(build_parser().parse_args()))
