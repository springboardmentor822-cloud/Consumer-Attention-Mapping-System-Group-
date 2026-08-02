"""
Sanity check: does checkout_detector_v3 actually detect products, or did it
memorize near-duplicate frames from the checkout_only_split?

Tests best.pt against a random sample of train2019 images (the exemplar set
we deliberately excluded from checkout_only_split) - completely unseen by
this training run, different visual style (single object, clean background)
but same underlying product classes.

A real detector should still find objects here, even if metrics are lower
than the near-perfect in-domain val numbers (different domain, so some drop
is expected and fine). A memorized detector will likely produce garbage:
missed detections, wildly wrong confidence, or nonsense boxes.
"""

import random
from pathlib import Path

from ultralytics import YOLO

MODEL_PATH = r"C:\Users\ritik\Downloads\Consumer Attention Mapping\backend\runs\detect\runs\detect\runs\checkout_detector_v4\weights\best.pt"
TRAIN2019_DIR = Path(r"C:\Users\ritik\Downloads\Consumer Attention Mapping\backend\data\rpc\retail_product_checkout\images\train2019")
SAMPLE_SIZE = 20
OUT_DIR = Path(r"C:\Users\ritik\Downloads\Consumer Attention Mapping\backend\generalization_check_output")

random.seed(1)

model = YOLO(MODEL_PATH)

all_images = list(TRAIN2019_DIR.glob("*.jpg"))
print(f"Found {len(all_images)} images in train2019")
sample = random.sample(all_images, min(SAMPLE_SIZE, len(all_images)))

OUT_DIR.mkdir(exist_ok=True)

total_detections = 0
zero_detection_images = 0
confidences = []

for img_path in sample:
    results = model.predict(source=str(img_path), conf=0.25, save=True, project=str(OUT_DIR), name="preds", exist_ok=True, verbose=False)
    r = results[0]
    n_det = len(r.boxes)
    total_detections += n_det
    if n_det == 0:
        zero_detection_images += 1
    else:
        confidences.extend(r.boxes.conf.tolist())
    print(f"{img_path.name}: {n_det} detections" + (f", confs: {[round(c,2) for c in r.boxes.conf.tolist()]}" if n_det else ""))

print()
print(f"Sample size: {len(sample)}")
print(f"Images with zero detections: {zero_detection_images} ({100*zero_detection_images/len(sample):.0f}%)")
print(f"Total detections: {total_detections}")
if confidences:
    print(f"Avg confidence: {sum(confidences)/len(confidences):.3f}")
print(f"Annotated images saved to: {OUT_DIR / 'preds'}")
