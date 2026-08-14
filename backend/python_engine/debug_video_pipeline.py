"""
Diagnostic Script for CAMS Video Pipeline
=========================================
Runs YOLOv8s + ByteTrack on sample frames of all 4 camera videos:
- store1.mp4 (CAM-01)
- aisle1.mp4 (CAM-02)
- checkout1.mp4 (CAM-03)
- checkout2.mp4 (CAM-04)

Prints detailed stats per video to locate why CAM-02 or any camera fails or drops detections.
"""

import os
import cv2
import time
from pathlib import Path
from ultralytics import YOLO

VIDEOS = {
    "CAM-01": "frontend/public/videos/store1.mp4",
    "CAM-02": "frontend/public/videos/aisle1.mp4",
    "CAM-03": "frontend/public/videos/checkout1.mp4",
    "CAM-04": "frontend/public/videos/checkout2.mp4",
}

def analyze_video(cam_id, video_path):
    print(f"\n========================================================")
    print(f" ANALYZING {cam_id}: {video_path}")
    print(f"========================================================")
    
    if not os.path.exists(video_path):
        print(f"ERROR: File not found: {video_path}")
        return

    cap = cv2.VideoCapture(video_path)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    print(f"Resolution: {width}x{height} | FPS: {fps:.2f} | Total Frames: {total_frames} | Duration: {total_frames/fps if fps else 0:.1f}s")

    model = YOLO("yolov8s.pt")
    tracker_cfg = str(Path("backend/python_engine/bytetrack.yaml").resolve())

    # Sample every 15 frames for 150 frames (10 sample points)
    frame_idx = 0
    detected_frames = 0
    total_persons_detected = 0
    total_tracks_confirmed = 0

    while frame_idx < min(300, total_frames):
        ret, frame = cap.read()
        if not ret:
            break
        frame_idx += 1

        if frame_idx % 15 != 0:
            continue

        t0 = time.perf_counter()
        
        # Test 1: Raw YOLO Predict (No Tracker)
        raw_results = model.predict(
            source=frame,
            classes=[0],
            conf=0.15,
            iou=0.50,
            imgsz=640,
            verbose=False
        )
        t_infer = (time.perf_counter() - t0) * 1000

        raw_boxes = raw_results[0].boxes if raw_results and raw_results[0].boxes is not None else []
        raw_person_count = len(raw_boxes)

        # Test 2: ByteTrack Track
        track_results = model.track(
            source=frame,
            persist=True,
            classes=[0],
            conf=0.15,
            iou=0.50,
            imgsz=640,
            tracker=tracker_cfg,
            verbose=False
        )
        
        track_boxes = track_results[0].boxes if track_results and track_results[0].boxes is not None else []
        confirmed_tracks = []
        if track_boxes is not None and track_boxes.id is not None:
            for i in range(len(track_boxes)):
                tid = int(track_boxes.id[i].item())
                conf = float(track_boxes.conf[i].item())
                xyxy = track_boxes.xyxy[i].tolist()
                confirmed_tracks.append((tid, conf, xyxy))

        print(f"  Frame {frame_idx:>4d} | Raw YOLO Persons: {raw_person_count} | ByteTrack Confirmed: {len(confirmed_tracks)} | Infer: {t_infer:.1f}ms")
        
        for tid, conf, (x1, y1, x2, y2) in confirmed_tracks:
            nx, ny, nw, nh = x1/width, y1/height, (x2-x1)/width, (y2-y1)/height
            print(f"     -> Track ID {tid:>2d} | Conf: {conf:.2f} | Normalized bbox: x={nx:.3f}, y={ny:.3f}, w={nw:.3f}, h={nh:.3f}")

        if raw_person_count > 0:
            detected_frames += 1
            total_persons_detected += raw_person_count
            total_tracks_confirmed += len(confirmed_tracks)

    cap.release()
    print(f"\nSummary for {cam_id}:")
    print(f"  Processed Sample Frames with Detections: {detected_frames}")
    print(f"  Total Raw Persons: {total_persons_detected}")
    print(f"  Total Confirmed Tracks: {total_tracks_confirmed}")

if __name__ == "__main__":
    for cam_id, video_path in VIDEOS.items():
        analyze_video(cam_id, video_path)
