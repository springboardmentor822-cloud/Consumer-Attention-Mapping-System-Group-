"""
Tunes ByteTrack's track_buffer for PersonDetector against Zone_2.mp4,
the same empirical method already used for ProductDetector's DeepSORT
max_age tuning: run the same clip through several buffer values, count
distinct track_ids, compare against the known ground truth (2 real
people, confirmed by eye against extracted sample frames — see chat).

Runs detection directly against the video (not through Redis/DB) so
these test runs don't pollute real tracking data.

Usage:
    python -m app.services.tune_person_tracker data\\Zone_2.mp4
"""
import argparse
import uuid

from app.services.detection import PersonDetector
from app.services.frame_pipeline import VideoFrameSource
from pathlib import Path

CONFIGS = [
    ("default (buffer=30, high_thresh=0.5)", "bytetrack.yaml"),
    ("buffer=60, high_thresh=0.5", str(Path(__file__).resolve().parents[2] / "bytetrack_buffer60.yaml")),
    ("buffer=60, high_thresh=0.25 (lowconf)", str(Path(__file__).resolve().parents[2] / "bytetrack_lowconf.yaml")),
]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("video_path", type=str)
    args = parser.parse_args()

    for label, tracker_path in CONFIGS:
        source = VideoFrameSource(Path(args.video_path), source_id="tuning-test")
        detector = PersonDetector(tracker=tracker_path)
        distinct_ids = set()
        dropped_frames = 0
        total_frames = 0
        for det in detector.detect_source(source):
            total_frames += 1
            if det["xyxy"] and not det["track_ids"]:
                dropped_frames += 1
            distinct_ids.update(det["track_ids"])
        print(f"{label}: {len(distinct_ids)} distinct track_ids, {dropped_frames}/{total_frames} frames had boxes but no ids")


if __name__ == "__main__":
    main()
