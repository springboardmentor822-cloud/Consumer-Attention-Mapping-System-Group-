"""
Diagnostic for the "0 track_ids but N boxes" warnings seen on Camera 1
(Zone_1.mp4) in timescale_writer.py's log. Runs PersonDetector directly
(bypassing Redis/DB) and prints, per frame: box count, and whether
Ultralytics returned track IDs for that frame at all - so we can see
exactly when/how often this happens and look for a pattern (e.g. only in
dense/crowded frames, only at the start, etc.) instead of guessing.

Usage:
    python -m app.services.debug_person_tracking data\\Zone_1.mp4
"""
import argparse
from pathlib import Path

from app.services.detection import PersonDetector
from app.services.frame_pipeline import VideoFrameSource

parser = argparse.ArgumentParser()
parser.add_argument("video_path", type=str)
args = parser.parse_args()

source = VideoFrameSource(Path(args.video_path), source_id="debug")
detector = PersonDetector()

total_frames = 0
frames_with_boxes_but_no_ids = 0
frames_with_ids = 0
frames_empty = 0

for det in detector.detect_source(source):
    total_frames += 1
    n_boxes = len(det["xyxy"])
    n_ids = len(det["track_ids"])

    if n_boxes > 0 and n_ids == 0:
        frames_with_boxes_but_no_ids += 1
        if frames_with_boxes_but_no_ids <= 5:  # only print the first few, not all of them
            print(f"frame {det['frame_index']}: {n_boxes} boxes, 0 ids  <-- BUG")
    elif n_ids > 0:
        frames_with_ids += 1
    else:
        frames_empty += 1

print(f"\nTotal frames: {total_frames}")
print(f"Frames with boxes but NO ids (the bug): {frames_with_boxes_but_no_ids}")
print(f"Frames with proper ids: {frames_with_ids}")
print(f"Frames with nothing detected: {frames_empty}")
