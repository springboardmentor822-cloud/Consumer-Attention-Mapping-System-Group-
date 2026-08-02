"""
Two checks in one script:

1. LEAKAGE CHECK
   - exact filename overlap between train/val image dirs
   - exact file-content (md5) overlap, catches renamed-but-identical copies
   - does NOT catch augmented near-duplicates (flipped/rotated/color-jittered) -
     that requires perceptual hashing, not covered here

2. LOCALIZATION CHECK
   - for the same 12 most-cluttered val images used before, greedily match each
     predicted box to the closest unmatched ground-truth box of the SAME class
     by IoU, then report per-image: matched/unmatched counts and mean IoU of
     matched pairs. This is the check that class-multiset comparison couldn't
     do - it tells you whether boxes are actually sitting on the right object,
     not just whether the right number of the right classes were predicted.

Run: python full_validation_check.py
"""

import hashlib
import json
import random
from pathlib import Path

from ultralytics import YOLO

# ---- paths (same as spotcheck_cluttered_val.py) ----
MODEL_PATH = r"C:\Users\ritik\Downloads\Consumer Attention Mapping\backend\runs\detect\runs\detect\runs\checkout_detector_v4\weights\best.pt"
SPLIT_DIR = Path(r"C:\Users\ritik\Downloads\Consumer Attention Mapping\backend\data\rpc\retail_product_checkout\checkout_only_split")
TRAIN_IMAGES_DIR = SPLIT_DIR / "images" / "train"
VAL_IMAGES_DIR = SPLIT_DIR / "images" / "val"
VAL_JSON = SPLIT_DIR / "instances_val.json"
SAMPLE_SIZE = 12
OUT_DIR = Path(r"C:\Users\ritik\Downloads\Consumer Attention Mapping\backend\spotcheck_output")
IOU_THRESHOLD_FOR_MATCH = 0.5  # a matched pred/gt pair below this IoU is flagged as a poor localization, not a miss

random.seed(2)


def file_hash(path: Path) -> str:
    return hashlib.md5(path.read_bytes()).hexdigest()


def box_iou(box_a, box_b):
    # boxes as [x1, y1, x2, y2]
    ax1, ay1, ax2, ay2 = box_a
    bx1, by1, bx2, by2 = box_b
    ix1, iy1 = max(ax1, bx1), max(ay1, by1)
    ix2, iy2 = min(ax2, bx2), min(ay2, by2)
    iw, ih = max(0.0, ix2 - ix1), max(0.0, iy2 - iy1)
    inter = iw * ih
    area_a = max(0.0, ax2 - ax1) * max(0.0, ay2 - ay1)
    area_b = max(0.0, bx2 - bx1) * max(0.0, by2 - by1)
    union = area_a + area_b - inter
    return inter / union if union > 0 else 0.0


def coco_xywh_to_xyxy(box):
    x, y, w, h = box
    return [x, y, x + w, y + h]


print("=" * 70)
print("CHECK 1: train/val leakage")
print("=" * 70)

train_paths = list(TRAIN_IMAGES_DIR.glob("*.jpg"))
val_paths = list(VAL_IMAGES_DIR.glob("*.jpg"))

train_names = {p.name for p in train_paths}
val_names = {p.name for p in val_paths}
name_overlap = train_names & val_names

print(f"train images: {len(train_names)}, val images: {len(val_names)}")
print(f"exact filename overlap: {len(name_overlap)}")
if name_overlap:
    print(f"  e.g.: {list(name_overlap)[:10]}")

print("hashing files for content-duplicate check (may take a moment)...")
train_hashes = {file_hash(p): p.name for p in train_paths}
val_hashes = {file_hash(p): p.name for p in val_paths}
hash_overlap = set(train_hashes) & set(val_hashes)

print(f"identical file-content overlap: {len(hash_overlap)}")
if hash_overlap:
    for h in list(hash_overlap)[:10]:
        print(f"  train:{train_hashes[h]}  ==  val:{val_hashes[h]}")

if not name_overlap and not hash_overlap:
    print("No exact filename or exact content leakage found. "
          "(This does NOT rule out augmented near-duplicates across the split.)")

print()
print("=" * 70)
print("CHECK 2: localization (IoU) on the 12 most cluttered val images")
print("=" * 70)

with open(VAL_JSON) as f:
    coco = json.load(f)

ann_count = {}
anns_by_image = {}
for ann in coco["annotations"]:
    ann_count[ann["image_id"]] = ann_count.get(ann["image_id"], 0) + 1
    anns_by_image.setdefault(ann["image_id"], []).append(ann)

cat_id_to_name = {c["id"]: c["name"] for c in coco["categories"]}
images_by_id = {img["id"]: img for img in coco["images"]}
sorted_ids = sorted(ann_count, key=ann_count.get, reverse=True)
top_cluttered = sorted_ids[:SAMPLE_SIZE]

model = YOLO(MODEL_PATH)
OUT_DIR.mkdir(exist_ok=True)

all_matched_ious = []

for img_id in top_cluttered:
    img_info = images_by_id[img_id]
    basename = Path(img_info["file_name"]).name
    img_path = VAL_IMAGES_DIR / basename
    if not img_path.exists():
        print(f"MISSING: {img_path}")
        continue

    gt_anns = anns_by_image[img_id]
    gt_boxes = [
        {"class": cat_id_to_name[a["category_id"]], "box": coco_xywh_to_xyxy(a["bbox"]), "matched": False}
        for a in gt_anns
    ]

    results = model.predict(source=str(img_path), conf=0.25, iou=0.7, save=True,
                             project=str(OUT_DIR), name="preds", exist_ok=True, verbose=False)
    r = results[0]
    pred_boxes = [
        {"class": model.names[int(c)], "box": b.tolist()}
        for c, b in zip(r.boxes.cls, r.boxes.xyxy)
    ]

    matched, unmatched_pred, low_iou = 0, 0, 0
    image_ious = []

    for pred in pred_boxes:
        # find the best-IoU unmatched gt box of the SAME class
        best_gt, best_iou = None, 0.0
        for gt in gt_boxes:
            if gt["matched"] or gt["class"] != pred["class"]:
                continue
            iou = box_iou(pred["box"], gt["box"])
            if iou > best_iou:
                best_iou, best_gt = iou, gt

        if best_gt is None:
            unmatched_pred += 1
            continue

        best_gt["matched"] = True
        matched += 1
        image_ious.append(best_iou)
        all_matched_ious.append(best_iou)
        if best_iou < IOU_THRESHOLD_FOR_MATCH:
            low_iou += 1

    unmatched_gt = sum(1 for gt in gt_boxes if not gt["matched"])
    mean_iou = sum(image_ious) / len(image_ious) if image_ious else 0.0

    print(f"{basename}: gt={len(gt_boxes)} pred={len(pred_boxes)} "
          f"matched={matched} unmatched_pred={unmatched_pred} unmatched_gt={unmatched_gt} "
          f"mean_iou={mean_iou:.3f} low_iou_matches(<{IOU_THRESHOLD_FOR_MATCH})={low_iou}")

print()
if all_matched_ious:
    overall_mean = sum(all_matched_ious) / len(all_matched_ious)
    print(f"Overall mean IoU across all matched boxes (all 12 images): {overall_mean:.3f}")
print("Any unmatched_pred > 0 means a predicted box of that class had no gt box left to pair with -"
      " a real extra detection, not just a same-class neighbor.")
print("Any low_iou_matches > 0 means a box was paired to the right object/class but drawn loosely -"
      " worth opening that image and looking at box tightness.")
