import os
import sys
import shutil
import csv
from pathlib import Path

# Setup paths
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ultralytics import YOLO

SKU_BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "datasets", "SKU110K", "SKU110K_fixed"))
YOLO_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "datasets", "SKU110K_yolo_production"))
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
    return yaml_path

def convert_full_sku110k():
    setup_directories()
    
    splits = {
        "train": os.path.join(SKU_BASE, "annotations", "annotations_train.csv"),
        "val": os.path.join(SKU_BASE, "annotations", "annotations_val.csv"),
        "test": os.path.join(SKU_BASE, "annotations", "annotations_test.csv")
    }
    
    # Process approximately 70% of SKU110K
    limits = {"train": 6000, "val": 1500, "test": 800}
    converted_summary = {}
    
    for split, csv_path in splits.items():
        if not os.path.exists(csv_path):
            continue
            
        limit = limits[split]
        copied_images = set()
        image_annotations = {}
        
        with open(csv_path, "r") as f:
            reader = csv.reader(f)
            for row in reader:
                if not row or len(row) < 8:
                    continue
                img_name, x1, y1, x2, y2, _, iw, ih = row
                
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
                except:
                    pass
                    
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
        print(f"Split {split}: Converted {len(copied_images)} annotations.")
        
    return converted_summary

def run_production_train():
    summary = convert_full_sku110k()
    yaml_path = generate_yaml()
    
    print("\n--- Production YOLOv8 Training Starting ---")
    model = YOLO("yolov8n.pt")
    
    # Train for 50 epochs on 640 image size with early stopping patience = 15
    model.train(
        data=yaml_path,
        epochs=50,
        batch=-1,
        imgsz=640,
        project=os.path.join(YOLO_DIR, "runs"),
        name="sku110k_prod",
        val=True,
        save=True,
        patience=15,
        mosaic=1.0,
        mixup=0.15,
        hsv_h=0.015,
        hsv_s=0.7,
        hsv_v=0.4
    )

if __name__ == "__main__":
    run_production_train()
