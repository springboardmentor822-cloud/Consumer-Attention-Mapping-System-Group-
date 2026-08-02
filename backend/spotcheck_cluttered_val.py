"""
Spot-check: run checkout_detector_v4 on a sample of the actual val split
it was trained/validated on (checkout_only_split/images/val), and inspect
whether it's correctly distinguishing individual items in cluttered scenes
rather than getting lucky with one big box over a cluster.

Prioritizes images with the most annotated instances (per instances_val.json)
since those are the hardest, most cluttered cases - the ones most likely to
expose a shortcut instead of real per-item localization.
"""

import json
import random
from pathlib import Path

from ultralytics import YOLO

MODEL_PATH = r"C:\Users\ritik\Downloads\Consumer Attention Mapping\backend\runs\detect\runs\detect\runs\checkout_detector_v4\weights\best.pt"
SPLIT_DIR = Path(r"C:\Users\ritik\Downloads\Consumer Attention Mapping\backend\data\rpc\retail_product_checkout\checkout_only_split")
VAL_IMAGES_DIR = SPLIT_DIR / "images" / "val"
VAL_JSON = SPLIT_DIR / "instances_val.json"
SAMPLE_SIZE = 12
OUT_DIR = Path(r"C:\Users\ritik\Downloads\Consumer Attention Mapping\backend\spotcheck_output")

random.seed(2)

with open(VAL_JSON) as f:
    coco = json.load(f)

# count instances per image, sort descending, take the most cluttered ones
ann_count = {}
for ann in coco["annotations"]:
    ann_count[ann["image_id"]] = ann_count.get(ann["image_id"], 0) + 1

images_by_id = {img["id"]: img for img in coco["images"]}
sorted_ids = sorted(ann_count, key=ann_count.get, reverse=True)
top_cluttered = sorted_ids[:SAMPLE_SIZE]

model = YOLO(MODEL_PATH)
OUT_DIR.mkdir(exist_ok=True)

print(f"Testing the {SAMPLE_SIZE} most cluttered val images (most ground-truth instances)\n")

for img_id in top_cluttered:
    img_info = images_by_id[img_id]
    file_name = img_info["file_name"]
    basename = Path(file_name).name
    img_path = VAL_IMAGES_DIR / basename

    if not img_path.exists():
        print(f"MISSING: {img_path}")
        continue

    gt_count = ann_count[img_id]
    results = model.predict(source=str(img_path), conf=0.25, iou=0.5, save=True, project=str(OUT_DIR), name="preds", exist_ok=True, verbose=False)
    r = results[0]
    pred_count = len(r.boxes)

    # per-class ground truth counts for this image
    gt_classes = [ann["category_id"] for ann in coco["annotations"] if ann["image_id"] == img_id]
    cat_id_to_name = {c["id"]: c["name"] for c in coco["categories"]}
    gt_class_names = sorted(cat_id_to_name[c] for c in gt_classes)

    pred_classes = sorted(model.names[int(c)] for c in r.boxes.cls)

    print(f"{basename}: gt={gt_count}, pred={pred_count}")
    print(f"  gt classes:   {gt_class_names}")
    print(f"  pred classes: {pred_classes}")

print(f"\nAnnotated images saved to: {OUT_DIR / 'preds'}")
print("Compare predicted count vs ground truth per image above, then eyeball the annotated images for correct class/box placement.")
