import os
import csv
import cv2
import random

# Setup paths
SKU_BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "datasets", "SKU110K", "SKU110K_fixed"))
OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "datasets", "output_videos", "overlays_100"))
os.makedirs(OUTPUT_DIR, exist_ok=True)

def verify_100_labels():
    csv_path = os.path.join(SKU_BASE, "annotations", "annotations_train.csv")
    if not os.path.exists(csv_path):
        print(f"Error: CSV path {csv_path} does not exist.")
        return
        
    # Read rows grouped by image name
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
            
    # Sample 100 random images to visualize
    random.seed(42)
    sampled_imgs = random.sample(list(image_rows.keys()), min(100, len(image_rows)))
    
    print(f"Generating overlays for {len(sampled_imgs)} images...")
    
    for idx, img_name in enumerate(sampled_imgs):
        rows = image_rows[img_name]
        src_img_path = os.path.join(SKU_BASE, "images", img_name)
        if not os.path.exists(src_img_path):
            continue
            
        img = cv2.imread(src_img_path)
        
        # Draw bounding boxes (GREEN for YOLO conversions)
        for row in rows:
            _, x1_s, y1_s, x2_s, y2_s, _, _, _ = row
            x1, y1, x2, y2 = int(float(x1_s)), int(float(y1_s)), int(float(x2_s)), int(float(y2_s))
            cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 1)
            
        out_path = os.path.join(OUTPUT_DIR, f"verify_{img_name}")
        cv2.imwrite(out_path, img)
        if (idx + 1) % 10 == 0:
            print(f"Generated {idx + 1}/100 overlay images.")

if __name__ == "__main__":
    verify_100_labels()
