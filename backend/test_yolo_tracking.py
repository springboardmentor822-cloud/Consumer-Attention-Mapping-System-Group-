# backend/test_yolo_tracking.py
"""
Benchmark & Verification Test for YOLOv8 Customer Tracking Service
"""

import os
import cv2
import time
from pathlib import Path
from app.services.customer_tracker import CustomerTracker

def run_yolo_tracker_test():
    print("=" * 60)
    print("Testing YOLOv8 Person Detection & Tracking Engine...")
    print("=" * 60)

    # Initialize tracker
    tracker = CustomerTracker(model_path="yolov8n.pt")

    # Define polygon Areas of Interest (AOI)
    tracker.define_areas_of_interest({
        "Entrance": [[0, 0], [300, 0], [300, 480], [0, 480]],
        "Shelf_Aisle_1": [[300, 0], [640, 0], [640, 300], [300, 300]],
        "Checkout_Zone": [[300, 300], [640, 300], [640, 480], [300, 480]]
    })

    # Find sample video
    base_dir = Path(__file__).resolve().parent.parent
    possible_videos = [
        base_dir / "Grocery.mp4",
        base_dir / "Entrance .mp4",
        base_dir / "checkout.mp4",
        base_dir / "frontend" / "public" / "videos" / "cctv_1.mp4"
    ]

    video_path = None
    for p in possible_videos:
        if p.exists():
            video_path = str(p)
            break

    if not video_path:
        print("[WARN] No video feed found for live test. Generating mock frame test...")
        mock_frame = (np.random.rand(480, 640, 3) * 255).astype(np.uint8)
        analysis = tracker.process_frame(mock_frame, frame_count=1)
        print(f"[OK] Fallback analysis result: {analysis['customer_count']} customers tracked.")
        return

    print(f"Opening video feed: {os.path.basename(video_path)}")
    cap = cv2.VideoCapture(video_path)
    frame_count = 0
    start_time = time.time()

    while cap.isOpened() and frame_count < 60:
        ret, frame = cap.read()
        if not ret:
            break

        frame_count += 1
        resized_frame = cv2.resize(frame, (640, 480))
        
        # Execute tracking pipeline
        analysis = tracker.process_frame(resized_frame, frame_count=frame_count)

        if frame_count % 10 == 0:
            print(f"Frame #{frame_count:03d} | Active Shoppers Tracked: {analysis['customer_count']} | Track IDs: {analysis['active_tracks']}")

    cap.release()
    duration = time.time() - start_time
    fps = round(frame_count / duration, 2) if duration > 0 else 0

    print("-" * 60)
    print(f"[SUCCESS] Processed {frame_count} frames in {duration:.2f}s ({fps} FPS)")
    insights = tracker.get_customer_insights()
    print("Customer Tracking Insights:")
    print(f" - Total Shoppers Tracked: {insights['total_customers_tracked']}")
    print(f" - Popular Store Areas: {insights['popular_areas']}")
    print("=" * 60)

if __name__ == "__main__":
    import numpy as np
    run_yolo_tracker_test()
