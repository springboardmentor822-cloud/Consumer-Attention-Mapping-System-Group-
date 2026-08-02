"""
Fixed manual COCO->YOLO conversion for the checkout_only_split JSONs.
Unlike the original convert_manual.py, this also copies the source
images (val2019/test2019 originals) into the split, so the output is
actually trainable — not just label files with no matching images.

Run from anywhere; paths are absolute below.
"""

import json
import shutil
from pathlib import Path

SPLIT_DIR = Path(r"C:\Users\ritik\Downloads\Consumer Attention Mapping\backend\data\rpc\retail_product_checkout\checkout_only_split")
IMAGES_SRC_ROOT = Path(r"C:\Users\ritik\Downloads\Consumer Attention Mapping\backend\data\rpc\retail_product_checkout\images")

OUT_IMAGES = SPLIT_DIR / "images"
OUT_LABELS = SPLIT_DIR / "labels"

for split in ["train", "val", "test"]:
    json_path = SPLIT_DIR / f"instances_{split}.json"
    with open(json_path) as f:
        coco = json.load(f)

    images = {img["id"]: img for img in coco["images"]}
    img_wh = {img["id"]: (img["width"], img["height"]) for img in coco["images"]}

    anns_by_image = {}
    for ann in coco["annotations"]:
        anns_by_image.setdefault(ann["image_id"], []).append(ann)

    label_count = 0
    image_count = 0
    missing = []

    for img_id, img in images.items():
        file_name = img["file_name"]  # e.g. "val2019/xxx.jpg" or "test2019/xxx.jpg"
        stem = Path(file_name).stem
        basename = Path(file_name).name

        # source image sits under images/val2019/ or images/test2019/,
        # regardless of which output split (train/val/test) it lands in here
        src_img = IMAGES_SRC_ROOT / file_name
        if not src_img.exists():
            missing.append(file_name)
            continue

        # write label
        w, h = img_wh[img_id]
        lines = []
        for ann in anns_by_image.get(img_id, []):
            x, y, bw, bh = ann["bbox"]
            cx, cy = (x + bw / 2) / w, (y + bh / 2) / h
            nw, nh = bw / w, bh / h
            cls_id = ann["category_id"] - 1  # verify this offset against categories list before trusting
            lines.append(f"{cls_id} {cx:.6f} {cy:.6f} {nw:.6f} {nh:.6f}")

        label_path = (OUT_LABELS / split / basename).with_suffix(".txt")
        label_path.parent.mkdir(parents=True, exist_ok=True)
        label_path.write_text("\n".join(lines))
        label_count += 1

        # copy image
        img_out_path = OUT_IMAGES / split / basename
        img_out_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src_img, img_out_path)
        image_count += 1

    print(f"{split}: wrote {label_count} labels, copied {image_count} images, {len(missing)} missing source images")
    if missing:
        print(f"  first few missing: {missing[:5]}")
