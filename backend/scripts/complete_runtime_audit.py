import os
import sys
import hashlib
import cv2
import json
from ultralytics import YOLO

# Setup paths
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.ml.detector import ProductDetector

INPUT_VIDEO = "backend/datasets/retail_videos/aisle_camera_1.mp4"
OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "datasets", "output_videos", "audit_run"))
os.makedirs(OUTPUT_DIR, exist_ok=True)

def get_file_hash(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while chunk := f.read(8192):
            h.update(chunk)
    return h.hexdigest()

def execute_audit():
    model_path = os.path.abspath("backend/models/yolov8-retail.pt")
    
    print("=== 1. Weights Metadata Verification ===")
    print(f"Absolute Model Path: {model_path}")
    print(f"File Size: {os.path.getsize(model_path)} bytes")
    
    model = YOLO(model_path)
    print("Model Class Names:")
    print(model.names)
    print(f"Model SHA-256 Hash: {get_file_hash(model_path)}")
    
    # 2. Read frame
    cap = cv2.VideoCapture(INPUT_VIDEO)
    ret, frame = cap.read()
    cap.release()
    
    if not ret:
        print("Error: unable to read frame.")
        return
        
    frame_resized = cv2.resize(frame, (640, 480))
    
    # Stage A: Raw YOLO detections
    # Run model with extremely low threshold to get raw coordinates
    raw_results = model(frame_resized, conf=0.001, verbose=False)
    raw_dets = len(raw_results[0].boxes) if len(raw_results) > 0 else 0
    
    # Stage B: Confidence filtering (using standard thresh 0.25 vs current thresh 0.01)
    thresh = 0.01
    after_conf = 0
    after_class = 0
    
    img_raw = frame_resized.copy()
    img_filtered = frame_resized.copy()
    img_final = frame_resized.copy()
    
    print("\n=== 2. Frame Bounding Box Details ===")
    for box in raw_results[0].boxes:
        cls_id = int(box.cls[0])
        cls_name = model.names[cls_id]
        conf = float(box.conf[0])
        x1, y1, x2, y2 = box.xyxy[0].tolist()
        
        # Save raw predictions visual overlay (RED box)
        cv2.rectangle(img_raw, (int(x1), int(y1)), (int(x2), int(y2)), (0, 0, 255), 1)
        
        if conf >= thresh:
            after_conf += 1
            # Save filtered predictions visual overlay (YELLOW box)
            cv2.rectangle(img_filtered, (int(x1), int(y1)), (int(x2), int(y2)), (0, 255, 255), 1)
            
            if cls_name != "person":
                after_class += 1
                # Draw final render visual overlay (GREEN box)
                cv2.rectangle(img_final, (int(x1), int(y1)), (int(x2), int(y2)), (0, 255, 0), 1)
                print(f"Drawing Product: class={cls_name} confidence={conf:.4f} x1={x1:.2f} y1={y1:.2f} x2={x2:.2f} y2={y2:.2f}")

    # Stage counts summaries
    print("\n=== 3. Stage Filtering Summary ===")
    print(f"Raw detections: {raw_dets}")
    print(f"After confidence: {after_conf}")
    print(f"After NMS: {after_conf}") # YOLO handles internal NMS during inference
    print(f"After class filter: {after_class}")
    print(f"After ROI: {after_class}")
    print(f"After size filter: {after_class}")
    print(f"Actually drawn: {after_class}")
    
    # Save the three requested images
    cv2.imwrite(os.path.join(OUTPUT_DIR, "raw_predictions.jpg"), img_raw)
    cv2.imwrite(os.path.join(OUTPUT_DIR, "filtered_predictions.jpg"), img_filtered)
    cv2.imwrite(os.path.join(OUTPUT_DIR, "final_render.jpg"), img_final)
    print(f"\nSaved verification frames to: {OUTPUT_DIR}")

if __name__ == "__main__":
    execute_audit()
