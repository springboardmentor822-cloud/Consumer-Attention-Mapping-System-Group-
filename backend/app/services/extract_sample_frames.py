"""
Extracts N evenly-spaced frames from a video and saves them as images, so
real people in frame can be counted by eye instead of assumed - needed to
ground whether PersonDetector's track-ID count for a clip is churn or
real turnover (same reasoning used for ProductDetector's max_age tuning
earlier this project).

Usage:
    python -m app.services.extract_sample_frames data\Zone_2.mp4 --count 6 --out sample_frames
"""
import argparse
from pathlib import Path

import cv2

parser = argparse.ArgumentParser()
parser.add_argument("video_path", type=str)
parser.add_argument("--count", type=int, default=6)
parser.add_argument("--out", type=str, default="sample_frames")
args = parser.parse_args()

cap = cv2.VideoCapture(args.video_path)
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
out_dir = Path(args.out)
out_dir.mkdir(exist_ok=True)

indices = [int(i * (total_frames - 1) / (args.count - 1)) for i in range(args.count)]

for i, idx in enumerate(indices):
    cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
    ok, frame = cap.read()
    if not ok:
        print(f"Could not read frame {idx}")
        continue
    out_path = out_dir / f"frame_{i}_of_{idx}.jpg"
    cv2.imwrite(str(out_path), frame)
    print(f"Saved {out_path}")

cap.release()
print(f"\n{len(indices)} frames saved to {out_dir}\\ — open them and count real distinct people across all of them.")
