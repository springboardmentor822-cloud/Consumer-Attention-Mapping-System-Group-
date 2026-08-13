import os
import sys
import shutil
import random
import json
from ultralytics import YOLO

# Setup paths
MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models"))
VAL_IMAGES_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "datasets", "SKU110K_yolo_advanced", "images", "val"))
OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "datasets", "output_videos", "direct_validation"))

os.makedirs(OUTPUT_DIR, exist_ok=True)

def run_direct_validation():
    model_path = os.path.join(MODELS_DIR, "yolov8-retail.pt")
    if not os.path.exists(model_path):
        print(f"Error: Model path {model_path} does not exist.")
        return
        
    print(f"Loading weights directly from: {model_path}")
    model = YOLO(model_path)
    
    if not os.path.exists(VAL_IMAGES_DIR):
        print(f"Error: Validation directory {VAL_IMAGES_DIR} does not exist.")
        return
        
    val_files = [f for f in os.listdir(VAL_IMAGES_DIR) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    if not val_files:
        print("No validation images found.")
        return
        
    # Sample 20 random validation images
    random.seed(42)
    sampled_files = random.sample(val_files, min(20, len(val_files)))
    
    print(f"Running inference on {len(sampled_files)} random validation images...")
    
    results_summary = {}
    
    for idx, filename in enumerate(sampled_files):
        img_path = os.path.join(VAL_IMAGES_DIR, filename)
        
        # Save original image copy
        orig_dest = os.path.join(OUTPUT_DIR, f"orig_{filename}")
        shutil.copy(img_path, orig_dest)
        
        # Run inference directly using YOLO API (using low threshold 0.01)
        results = model(img_path, conf=0.01, verbose=False)
        
        # Save prediction image
        pred_dest = os.path.join(OUTPUT_DIR, f"pred_{filename}")
        results[0].save(pred_dest)
        
        # Extract metrics
        boxes = results[0].boxes
        num_dets = len(boxes)
        confs = [float(box.conf[0]) for box in boxes]
        class_ids = [int(box.cls[0]) for box in boxes]
        
        # Save log file
        log_dest = os.path.join(OUTPUT_DIR, f"log_{os.path.splitext(filename)[0]}.json")
        with open(log_dest, "w") as lf:
            json.dump({
                "filename": filename,
                "number_of_detections": num_dets,
                "confidence_scores": confs,
                "predicted_class_ids": class_ids
            }, lf, indent=2)
            
        print(f"Img #{idx+1}: {filename} | Detections: {num_dets} | Original: orig_{filename} | Prediction: pred_{filename}")
        
    print(f"\nAll validation artifacts saved directly to: {OUTPUT_DIR}")

if __name__ == "__main__":
    run_direct_validation()
