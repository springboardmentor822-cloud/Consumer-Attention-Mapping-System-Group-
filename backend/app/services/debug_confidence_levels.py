"""
Tests the theory that Zone_1.mp4's person detections mostly fall between
conf=0.25 (detector's own threshold) and track_high_thresh=0.5 (ByteTrack's
threshold for STARTING a new track) - which would explain boxes existing
with no track_id: ByteTrack can use low-confidence detections to continue
an existing track, but never to create a new one, so if nothing is active
yet, they get no id at all despite being real detections.

Usage:
    python -m app.services.debug_confidence_levels data\\Zone_1.mp4
"""
import argparse
from pathlib import Path

from app.services.detection import PersonDetector
from app.services.frame_pipeline import VideoFrameSource

parser = argparse.ArgumentParser()
parser.add_argument("video_path", type=str)
parser.add_argument("--frames", type=int, default=10, help="How many frames to inspect")
args = parser.parse_args()

source = VideoFrameSource(Path(args.video_path), source_id="debug")
detector = PersonDetector()

for i, det in enumerate(detector.detect_source(source)):
    if i >= args.frames:
        break
    confs = [round(c, 3) for c in det["conf"]]
    print(f"frame {det['frame_index']}: {len(det['xyxy'])} boxes, confs={confs}, ids={det['track_ids']}")
