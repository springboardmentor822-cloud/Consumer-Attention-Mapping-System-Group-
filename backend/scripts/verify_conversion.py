import os
import sys
import csv
import cv2
import random

# Setup paths
SKU_BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "datasets", "SKU110K", "SKU110K_fixed"))
OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "datasets", "output_videos", "overlays"))
os.makedirs(OUTPUT_DIR, exist_ok=True)

def verify_and_overlay():
    csv_path = os.path.join(SKU_BASE, "annotations", "annotations_val.csv")
    if not os.path.exists(csv_path):
        print(f"Error: CSV path {csv_path} does not exist.")
        return
        
    print(f"Auditing SKU110K annotation schema in: {csv_path}")
    
    # Read rows grouped by image
    image_rows = {}
    with open(csv_path, "r") as f:
        reader = csv.reader(f)
        for row in reader:
            if not row or len(row) < 8:
                continue
            img_name = row[0]
            if img_name not in image_rows:
                image_rows[img_name] = []
            image_rows[img_name].append(row)
            
    # Sample 20 random images
    random.seed(42)
    sampled_imgs = random.sample(list(image_rows.keys()), min(20, len(image_rows)))
    
    print(f"\n--- Coordinate Normalization Verification (Sample of 20 images) ---")
    
    for img_name in sampled_imgs:
        rows = image_rows[img_name]
        src_img_path = os.path.join(SKU_BASE, "images", img_name)
        if not os.path.exists(src_img_path):
            continue
            
        # Read raw image
        img = cv2.imread(src_img_path)
        ih, iw, _ = img.shape
        
        yolo_labels = []
        error_count = 0
        
        # Verify columns mapping and normalized conversion
        for row in rows:
            _, x1_s, y1_s, x2_s, y2_s, _, iw_s, ih_s = row
            x1, y1, x2, y2 = float(x1_s), float(y1_s), float(x2_s), float(y2_s)
            
            # Check dimensions match image shape
            if int(iw_s) != iw or int(ih_s) != ih:
                error_count += 1
                
            # Normalize coordinates
            x_center = (x1 + x2) / 2.0 / iw
            y_center = (y1 + y2) / 2.0 / ih
            width = (x2 - x1) / iw
            height = (y2 - y1) / ih
            
            # Validate bounds
            if not (0.0 <= x_center <= 1.0 and 0.0 <= y_center <= 1.0 and 0.0 <= width <= 1.0 and 0.0 <= height <= 1.0):
                error_count += 1
                
            yolo_labels.append((x_center, y_center, width, height))
            
            # Draw original coordinates onto image (RED box)
            cv2.rectangle(img, (int(x1), int(y1)), (int(x2), int(y2)), (0, 0, 255), 2)
            
            # Draw converted coordinates back from YOLO format (GREEN box)
            cx = x_center * iw
            cy = y_center * ih
            w = width * iw
            h = height * ih
            rx1 = int(cx - w / 2)
            ry1 = int(cy - h / 2)
            rx2 = int(cx + w / 2)
            ry2 = int(cy + h / 2)
            cv2.rectangle(img, (rx1, ry1), (rx2, ry2), (0, 255, 0), 1)
            
        # Save output verification image
        out_path = os.path.join(OUTPUT_DIR, f"verify_{img_name}")
        cv2.imwrite(out_path, img)
        print(f"Image: {img_name} | Detections verified: {len(rows)} | Bounds violations: {error_count} | Output: {os.path.basename(out_path)}")

if __name__ == "__main__":
    verify_and_overlay()
