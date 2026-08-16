"""
Grabs a single still frame from a video source and saves it as an image,
so you have something to measure pixel coordinates against when building
a points.json file for calibrate.py.

Usage:
    python extract_frame.py --source ../video_intake/sample_data/vtest.avi --output reference.jpg
    python extract_frame.py --source rtsp://192.168.1.50:554/stream1 --output reference.jpg
"""
import argparse

import cv2


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True)
    parser.add_argument("--output", default="reference.jpg")
    parser.add_argument("--frame-index", type=int, default=0, help="Which frame to grab (file sources only).")
    args = parser.parse_args()

    cap_source: str | int = int(args.source) if args.source.isdigit() else args.source
    cap = cv2.VideoCapture(cap_source)
    if not cap.isOpened():
        raise SystemExit(f"Could not open source: {args.source}")

    for _ in range(args.frame_index):
        cap.grab()

    ok, frame = cap.read()
    cap.release()
    if not ok:
        raise SystemExit("Could not read a frame from the source.")

    cv2.imwrite(args.output, frame)
    h, w = frame.shape[:2]
    print(f"Saved {w}x{h} reference frame to {args.output}")
    print("Open it in any image viewer, hover over your reference points, and note their pixel coordinates.")


if __name__ == "__main__":
    main()
