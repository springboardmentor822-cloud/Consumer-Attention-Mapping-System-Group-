import os
import cv2
import time
import uuid
import requests
from datetime import datetime, timezone
from ultralytics import YOLO

# Configuration
API_INGEST_URL = "http://localhost:8000/api/stream/ingest"
STORE_ID = "00000000-0000-0000-0000-000000000000"  # Fallback zero UUID if not provided
CAMERA_ID = "camera-1"
VIDEO_PATH = os.path.join(os.path.dirname(__file__), "..", "datasets", "retail_sample.mp4")

def track_video(video_source=0, store_id=STORE_ID, camera_id=CAMERA_ID):
    print(f"Starting Multi-Object Tracking (MOT) pipeline...")
    print(f"Video Source: {video_source}")
    print(f"Store ID: {store_id}, Camera ID: {camera_id}")

    # Load YOLOv8 model (using standard YOLOv8 nano for speed)
    model = YOLO('yolov8n.pt')

    # Open video capture
    cap = cv2.VideoCapture(video_source)
    if not cap.isOpened():
        print(f"Error: Could not open video source {video_source}")
        return

    frame_count = 0
    start_time = time.time()

    # Process frames
    # 0: person, 39: bottle, 41: cup, 45: bowl, 46: banana, 47: apple, 49: orange, 50: broccoli, 51: carrot, 54: donut, 73: book, 75: vase
    # We include common objects that resemble retail products for the demo
    results = model.track(source=video_source, tracker="bytetrack.yaml", stream=True, persist=True, classes=[0, 39, 41, 45, 46, 47, 49, 50, 51, 54, 73, 75])

    for result in results:
        frame_count += 1
        current_time = datetime.now(timezone.utc).isoformat()
        
        # Get boxes and track IDs
        boxes = result.boxes
        if boxes is not None and boxes.id is not None:
            track_ids = boxes.id.int().cpu().tolist()
            coordinates = boxes.xywh.cpu().tolist() # x_center, y_center, width, height
            class_ids = boxes.cls.int().cpu().tolist() # Get object class
            
            # Prepare batch of coordinates for this frame
            for track_id, (x_center, y_center, w, h), cls_id in zip(track_ids, coordinates, class_ids):
                # Class 0 is person, everything else is treated as a product for mapping
                entity_label = f"Shopper #{track_id}" if cls_id == 0 else f"Product #{track_id}"
                
                payload = {
                    "store_id": store_id,
                    "camera_id": camera_id,
                    "shopper_id": entity_label,
                    "x": float(x_center),
                    "y": float(y_center),
                    "timestamp": current_time
                }
                
                # Push to backend decoupled ingest layer
                try:
                    requests.post(API_INGEST_URL, json=payload, timeout=0.5)
                except requests.exceptions.RequestException:
                    pass # Drop frame coordinate if API is busy (UDP style)
        
        # Calculate FPS
        elapsed = time.time() - start_time
        fps = frame_count / elapsed
        if frame_count % 30 == 0:
            print(f"Tracking FPS: {fps:.2f} | Pushed coordinates for {len(track_ids) if boxes is not None and boxes.id is not None else 0} shoppers")
            
        # Visualize the live tracking feed
        annotated_frame = result.plot()
        cv2.imshow("Live Store Camera (YOLOv8)", annotated_frame)
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()
    print("Tracking pipeline finished.")

if __name__ == "__main__":
    try:
        # Force the tracker to use the primary laptop webcam (0)
        source = 0
        track_video(video_source=source)
    except Exception as e:
        import traceback
        print("CRITICAL ERROR IN LIVE TRACKER:")
        traceback.print_exc()
        input("Press Enter to exit...")
