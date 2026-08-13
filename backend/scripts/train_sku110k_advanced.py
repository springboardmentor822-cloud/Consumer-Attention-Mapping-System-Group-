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
YOLO_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "datasets", "SKU110K_yolo_advanced"))
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

def convert_annotations_advanced():
    setup_directories()
    
    # Process train, val, and test splits
    splits = {
        "train": os.path.join(SKU_BASE, "annotations", "annotations_train.csv"),
        "val": os.path.join(SKU_BASE, "annotations", "annotations_val.csv"),
        "test": os.path.join(SKU_BASE, "annotations", "annotations_test.csv")
    }
    
    # 60-70% image scale limits
    limits = {"train": 2000, "val": 600, "test": 300}
    converted_summary = {}
    
    for split, csv_path in splits.items():
        if not os.path.exists(csv_path):
            print(f"CSV path {csv_path} not found. Skipping.")
            continue
            
        print(f"Converting annotations for split: {split}")
        limit = limits[split]
        copied_images = set()
        image_annotations = {}
        
        with open(csv_path, "r") as f:
            reader = csv.reader(f)
            for row in reader:
                if not row or len(row) < 8:
                    continue
                img_name, x1, y1, x2, y2, _, iw, ih = row
                
                # Check limits
                if img_name not in copied_images and len(copied_images) >= limit:
                    continue
                    
                copied_images.add(img_name)
                
                try:
                    x1, y1, x2, y2 = float(x1), float(y1), float(x2), float(y2)
                    iw, ih = float(iw), float(ih)
                    
                    x_center = (x1 + x2) / 2.0 / iw
                    y_center = (y1 + y2) / 2.0 / ih
                    width = (x2 - x1) / iw
                    height = (y2 - y1) / ih
                    
                    x_center = max(0.0, min(1.0, x_center))
                    y_center = max(0.0, min(1.0, y_center))
                    width = max(0.0, min(1.0, width))
                    height = max(0.0, min(1.0, height))
                    
                    if img_name not in image_annotations:
                        image_annotations[img_name] = []
                    image_annotations[img_name].append(f"0 {x_center:.6f} {y_center:.6f} {width:.6f} {height:.6f}")
                except Exception as e:
                    pass
                    
        # Copy files to split directories
        src_img_dir = os.path.join(SKU_BASE, "images")
        dest_img_dir = os.path.join(YOLO_DIR, "images", split)
        dest_lbl_dir = os.path.join(YOLO_DIR, "labels", split)
        
        for img_name in copied_images:
            src_img_path = os.path.join(src_img_dir, img_name)
            if not os.path.exists(src_img_path):
                continue
                
            shutil.copy(src_img_path, os.path.join(dest_img_dir, img_name))
            
            lbl_name = os.path.splitext(img_name)[0] + ".txt"
            lbl_path = os.path.join(dest_lbl_dir, lbl_name)
            
            boxes = image_annotations.get(img_name, [])
            with open(lbl_path, "w") as lf:
                lf.write("\n".join(boxes))
                
        converted_summary[split] = len(copied_images)
        print(f"Converted {len(copied_images)} labels for {split}.")
        
    return converted_summary

def run_advanced_pipeline():
    summary = convert_annotations_advanced()
    yaml_path = generate_yaml()
    
    # In order to allow live demonstrations to function instantly without CPU delays,
    # we initialize the model, validate, copy best weights and outputs, then run a short fit.
    print("\nInitializing advanced YOLOv8 training on scaled SKU110K...")
    model = YOLO("yolov8n.pt")
    
    # Start training with parameters: img size=640, patience=10, 30 epochs
    model.train(
        data=yaml_path,
        epochs=30,
        batch=-1,       # Auto batch size selection
        imgsz=640,
        project=os.path.join(YOLO_DIR, "runs"),
        name="sku110k_train_advanced",
        val=True,
        save=True,
        patience=10,
        device="cpu",   # Run on CPU
        mosaic=1.0,     # Enable augmentations
        hsv_h=0.015,
        hsv_s=0.7,
        hsv_v=0.4
    )
    
    best_weights = os.path.join(YOLO_DIR, "runs", "sku110k_train_advanced", "weights", "best.pt")
    final_weights = os.path.join(MODELS_DIR, "yolov8-retail.pt")
    if os.path.exists(best_weights):
        shutil.copy(best_weights, final_weights)
        print(f"Trained weights copied successfully to {final_weights}")
        
    # Perform Validation and print metrics
    model_eval = YOLO(final_weights)
    metrics = model_eval.val()
    
    precision = metrics.results_dict.get('metrics/precision(B)', 0.0)
    recall = metrics.results_dict.get('metrics/recall(B)', 0.0)
    map50 = metrics.results_dict.get('metrics/mAP50(B)', 0.0)
    map50_95 = metrics.results_dict.get('metrics/mAP50-95(B)', 0.0)
    
    print("\n--- Advanced Validation Metrics ---")
    print(f"Precision: {precision:.4f}")
    print(f"Recall: {recall:.4f}")
    print(f"mAP50: {map50:.4f}")
    print(f"mAP50-95: {map50_95:.4f}")
    
    val_images_dir = os.path.join(YOLO_DIR, "images", "val")
    val_images = [os.path.join(val_images_dir, f) for f in os.listdir(val_images_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    if val_images:
        for idx, img in enumerate(val_images[:3]):
            results = model_eval(img)
            out_img_path = os.path.join(OUTPUT_DIR, f"sku110k_advanced_sample_{idx}.jpg")
            results[0].save(out_img_path)
            print(f"Sample inference validation image saved to: {out_img_path}")

if __name__ == "__main__":
    run_advanced_pipeline()
