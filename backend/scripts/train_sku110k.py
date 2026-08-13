import os
import sys
import shutil
import csv
import time
from pathlib import Path

# Setup import path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ultralytics import YOLO

# Constants
SKU_BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "datasets", "SKU110K", "SKU110K_fixed"))
YOLO_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "datasets", "SKU110K_yolo"))
MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models"))
OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "datasets", "output_videos"))

os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

def setup_directories():
    for split in ["train", "val", "test"]:
        os.makedirs(os.path.join(YOLO_DIR, "images", split), exist_ok=True)
        os.makedirs(os.path.join(YOLO_DIR, "labels", split), exist_ok=True)

def generate_yaml():
    yaml_content = f"""path: {YOLO_DIR.replace('\\', '/')}
train: images/train
val: images/val
test: images/test
names:
  0: product
"""
    yaml_path = os.path.join(YOLO_DIR, "dataset.yaml")
    with open(yaml_path, "w") as f:
        f.write(yaml_content)
    print(f"Generated dataset.yaml at {yaml_path}")
    return yaml_path

def convert_annotations():
    setup_directories()
    
    # Process train, val, and test splits
    splits = {
        "train": os.path.join(SKU_BASE, "annotations", "annotations_train.csv"),
        "val": os.path.join(SKU_BASE, "annotations", "annotations_val.csv"),
        "test": os.path.join(SKU_BASE, "annotations", "annotations_test.csv")
    }
    
    # Limit number of images per split to keep CPU training swift
    limits = {"train": 100, "val": 30, "test": 15}
    
    converted_summary = {}
    
    for split, csv_path in splits.items():
        if not os.path.exists(csv_path):
            print(f"CSV path {csv_path} not found. Skipping.")
            continue
            
        print(f"Converting annotations for split: {split}")
        limit = limits[split]
        copied_images = set()
        
        # Map to hold labels: image_name -> list of box entries
        image_annotations = {}
        
        with open(csv_path, "r") as f:
            reader = csv.reader(f)
            for row in reader:
                if not row or len(row) < 8:
                    continue
                img_name, x1, y1, x2, y2, _, iw, ih = row
                
                # Check limit
                if img_name not in copied_images and len(copied_images) >= limit:
                    continue
                    
                copied_images.add(img_name)
                
                try:
                    x1, y1, x2, y2 = float(x1), float(y1), float(x2), float(y2)
                    iw, ih = float(iw), float(ih)
                    
                    # Normalize to YOLO format (0: class_id, x_center, y_center, width, height)
                    x_center = (x1 + x2) / 2.0 / iw
                    y_center = (y1 + y2) / 2.0 / ih
                    width = (x2 - x1) / iw
                    height = (y2 - y1) / ih
                    
                    # Clip coordinates to [0, 1]
                    x_center = max(0.0, min(1.0, x_center))
                    y_center = max(0.0, min(1.0, y_center))
                    width = max(0.0, min(1.0, width))
                    height = max(0.0, min(1.0, height))
                    
                    if img_name not in image_annotations:
                        image_annotations[img_name] = []
                    image_annotations[img_name].append(f"0 {x_center:.6f} {y_center:.6f} {width:.6f} {height:.6f}")
                except Exception as e:
                    print(f"Error parsing row {row}: {e}")
                    
        # Copy images and write label files
        src_img_dir = os.path.join(SKU_BASE, "images")
        dest_img_dir = os.path.join(YOLO_DIR, "images", split)
        dest_lbl_dir = os.path.join(YOLO_DIR, "labels", split)
        
        for img_name in copied_images:
            src_img_path = os.path.join(src_img_dir, img_name)
            if not os.path.exists(src_img_path):
                continue
                
            # Copy Image
            shutil.copy(src_img_path, os.path.join(dest_img_dir, img_name))
            
            # Write Label file
            lbl_name = os.path.splitext(img_name)[0] + ".txt"
            lbl_path = os.path.join(dest_lbl_dir, lbl_name)
            
            boxes = image_annotations.get(img_name, [])
            with open(lbl_path, "w") as lf:
                lf.write("\n".join(boxes))
                
        converted_summary[split] = len(copied_images)
        print(f"Converted {len(copied_images)} labels and copied corresponding images for {split}.")
        
    return converted_summary

def run_pipeline():
    # 1. Convert Dataset
    summary = convert_annotations()
    yaml_path = generate_yaml()
    
    # 2. Initialize and Train YOLOv8 Model
    print("\nStarting YOLOv8 training on SKU110K dataset...")
    model = YOLO("yolov8n.pt")
    
    # Train for 3 epochs with batch size 8 to finish fast
    model.train(
        data=yaml_path,
        epochs=3,
        batch=8,
        imgsz=320, # reduced image size for fast CPU execution
        project=os.path.join(YOLO_DIR, "runs"),
        name="sku110k_train",
        val=True,
        save=True,
        verbose=False
    )
    
    # Save weights to final path
    best_weights = os.path.join(YOLO_DIR, "runs", "sku110k_train", "weights", "best.pt")
    final_weights = os.path.join(MODELS_DIR, "yolov8-retail.pt")
    if os.path.exists(best_weights):
        shutil.copy(best_weights, final_weights)
        print(f"Trained weights copied successfully to {final_weights}")
    else:
        # Fallback copy if best.pt wasn't created due to early stop
        last_weights = os.path.join(YOLO_DIR, "runs", "sku110k_train", "weights", "last.pt")
        if os.path.exists(last_weights):
            shutil.copy(last_weights, final_weights)
            print(f"Last trained weights copied to {final_weights}")
            
    # 3. Perform Validation and Print Metrics
    print("\nRunning Validation...")
    model_eval = YOLO(final_weights)
    metrics = model_eval.val()
    
    # Extract Metrics
    precision = metrics.results_dict.get('metrics/precision(B)', 0.0)
    recall = metrics.results_dict.get('metrics/recall(B)', 0.0)
    map50 = metrics.results_dict.get('metrics/mAP50(B)', 0.0)
    map50_95 = metrics.results_dict.get('metrics/mAP50-95(B)', 0.0)
    
    print("\n--- Validation Metrics ---")
    print(f"Precision: {precision:.4f}")
    print(f"Recall: {recall:.4f}")
    print(f"mAP50: {map50:.4f}")
    print(f"mAP50-95: {map50_95:.4f}")
    
    # 4. Run Sample Inference
    print("\nRunning sample inference on validation images...")
    val_images_dir = os.path.join(YOLO_DIR, "images", "val")
    val_images = [os.path.join(val_images_dir, f) for f in os.listdir(val_images_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    
    if val_images:
        sample_img = val_images[0]
        results = model_eval(sample_img)
        
        # Save output image
        out_img_path = os.path.join(OUTPUT_DIR, "sku110k_inference_sample.jpg")
        results[0].save(out_img_path)
        print(f"Sample inference saved to: {out_img_path}")

if __name__ == "__main__":
    run_pipeline()
