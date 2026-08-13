import os
import sys
import cv2
from ultralytics import YOLO

# Setup paths
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.ml.detector import ProductDetector

INPUT_VIDEO = "backend/datasets/retail_videos/aisle_camera_1.mp4"
OUTPUT_RAW = "backend/datasets/output_videos/raw_inference_aisle.jpg"

def audit_inference():
    cap = cv2.VideoCapture(INPUT_VIDEO)
    ret, frame = cap.read()
    cap.release()
    
    if not ret:
        print("Error: Could not read frame from video.")
        return
        
    frame_resized = cv2.resize(frame, (640, 480))
    
    print("--- 1. Initializing ProductDetector ---")
    detector = ProductDetector()
    
    # Run model directly
    print("\n--- 2. Running Raw YOLO model on 640x480 frame ---")
    results = detector.model(frame_resized, conf=0.01, verbose=False)
    
    img_raw = frame_resized.copy()
    
    print("\n--- 3. Raw Bounding Box Details ---")
    if len(results) > 0 and len(results[0].boxes) > 0:
        for idx, box in enumerate(results[0].boxes):
            cls_id = int(box.cls[0])
            cls_name = detector.model.names[cls_id]
            conf = float(box.conf[0])
            xyxy = box.xyxy[0].tolist()
            x1, y1, x2, y2 = xyxy
            w = x2 - x1
            h = y2 - y1
            
            # Print details
            print(f"Det #{idx} | Class: {cls_id} ({cls_name}) | Conf: {conf:.4f} | Coords: [{x1:.2f}, {y1:.2f}, {x2:.2f}, {y2:.2f}] | Dimensions: w={w:.2f}, h={h:.2f}")
            
            # Draw on raw image (RED box)
            cv2.rectangle(img_raw, (int(x1), int(y1)), (int(x2), int(y2)), (0, 0, 255), 2)
            
        cv2.imwrite(OUTPUT_RAW, img_raw)
        print(f"\nSaved raw YOLO visualization to: {os.path.abspath(OUTPUT_RAW)}")
    else:
        print("No raw detections found.")

if __name__ == "__main__":
    audit_inference()
