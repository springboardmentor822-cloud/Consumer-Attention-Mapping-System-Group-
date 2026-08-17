import cv2
import time
import torch
import numpy as np
from ultralytics import YOLO
from ultralytics.trackers.byte_tracker import BYTETracker
from types import SimpleNamespace

model_path = 'yolov8s.pt'
print(f"Loading {model_path}...")
model = YOLO(model_path)
model.to('cpu')

video_path = 'frontend/public/videos/store1.mp4'
cap = cv2.VideoCapture(video_path)
w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
print(f"Video {video_path}: {w}x{h} @ {fps} FPS, {total_frames} frames")

args = SimpleNamespace(
    track_high_thresh=0.30,
    track_low_thresh=0.10,
    new_track_thresh=0.35,
    track_buffer=60,
    match_thresh=0.75,
    fuse_score=True,
    fps=30,
)
tracker = BYTETracker(args=args)

for frame_idx in range(45):
    ret, frame = cap.read()
    if not ret:
        break
    
    t0 = time.perf_counter()
    # Predict person class (0) only
    results = model.predict(source=frame, conf=0.25, classes=[0], imgsz=640, verbose=False)
    dt = (time.perf_counter() - t0) * 1000
    
    boxes = results[0].boxes
    person_boxes = []
    if boxes is not None and len(boxes) > 0:
        for i in range(len(boxes)):
            conf = float(boxes.conf[i].item())
            x1, y1, x2, y2 = boxes.xyxy[i].tolist()
            bw = x2 - x1
            bh = y2 - y1
            aspect = bh / max(bw, 1e-3)
            # print box details
            person_boxes.append((x1, y1, x2, y2, conf, bw, bh, aspect))
            
    raw_tracks = tracker.update(boxes) if boxes is not None and len(boxes) > 0 else []
    track_ids = [int(t[4]) for t in raw_tracks] if len(raw_tracks) > 0 else []
    
    print(f"Frame {frame_idx:02d} ({dt:.1f}ms): {len(person_boxes)} persons detected, ByteTrack tracks: {track_ids}")
    for p in person_boxes[:3]:
        print(f"   -> Box [w={p[5]:.1f}, h={p[6]:.1f}, aspect={p[7]:.2f}, conf={p[4]:.2f}]")

cap.release()
