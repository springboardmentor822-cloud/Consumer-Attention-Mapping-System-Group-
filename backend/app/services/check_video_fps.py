"""
Prints a video file's actual FPS metadata. Needed because dwell-time math
must use frame_index / real_fps for elapsed time (not event_time, which
reflects processing speed, not video playback speed - see chat discussion).
Guessing a common default like 30fps instead of checking would silently
skew every dwell-time number computed from it - not worth the risk when
checking costs one line.

Usage:
    python -m app.services.check_video_fps data\Zone_2.mp4
"""
import argparse
import cv2

parser = argparse.ArgumentParser()
parser.add_argument("video_path", type=str)
args = parser.parse_args()

cap = cv2.VideoCapture(args.video_path)
if not cap.isOpened():
    print(f"Could not open {args.video_path}")
else:
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_count = cap.get(cv2.CAP_PROP_FRAME_COUNT)
    width = cap.get(cv2.CAP_PROP_FRAME_WIDTH)
    height = cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
    print(f"FPS: {fps}")
    print(f"Frame count: {frame_count}")
    print(f"Resolution: {int(width)}x{int(height)}")
    print(f"Duration (s): {frame_count / fps if fps else 'unknown'}")
cap.release()
