"""Run persistent YOLO+ByteTrack inference over a video into JSONL."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.ml.errors import MLError  # noqa: E402
from app.ml.inference import YOLOByteTracker, write_tracks_jsonl  # noqa: E402
from app.ml.video import ResizeSpec, VideoFrameIterator  # noqa: E402


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Stream a video through YOLO and persistent ByteTrack.")
    parser.add_argument("video", type=Path)
    parser.add_argument("--model", default="yolov8n.pt")
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--confidence", type=float, default=0.25)
    parser.add_argument("--iou", type=float, default=0.7)
    parser.add_argument("--device")
    parser.add_argument("--class-id", action="append", type=int, default=[])
    parser.add_argument("--stride", type=int, default=1)
    parser.add_argument("--max-frames", type=int)
    parser.add_argument("--width", type=int)
    parser.add_argument("--height", type=int)
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    if (args.width is None) != (args.height is None):
        print("ERROR: --width and --height must be supplied together.", file=sys.stderr)
        return 2
    resize = ResizeSpec(args.width, args.height) if args.width is not None else None
    try:
        frames = VideoFrameIterator(
            args.video,
            resize=resize,
            stride=args.stride,
            max_frames=args.max_frames,
        )
        tracker = YOLOByteTracker(
            args.model,
            confidence_threshold=args.confidence,
            iou_threshold=args.iou,
            classes=tuple(args.class_id) or None,
            device=args.device,
        )
        destination = write_tracks_jsonl(tracker.process_video_frames(frames), args.output)
    except (MLError, FileNotFoundError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2
    with destination.open("r", encoding="utf-8") as handle:
        count = sum(1 for _ in handle)
    print(json.dumps({"status": "completed", "frames": count, "output": str(destination)}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
