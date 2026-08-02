"""
Rebuilds RPC into a train/val/test split using ONLY checkout-domain
images (val2019 + test2019), dropping the single-product exemplar
set (train2019) entirely, since that's the source of the train/test
domain gap that broke the first training run.
"""

import json
import random
from pathlib import Path

RPC_ROOT = Path(r"C:\Users\ritik\Downloads\Consumer Attention Mapping\backend\data\rpc\retail_product_checkout")
OUTPUT_DIR = RPC_ROOT / "checkout_only_split"
SPLIT_RATIOS = {"train": 0.70, "val": 0.15, "test": 0.15}
SEED = 42


def load_coco(path: Path) -> dict:
    with open(path) as f:
        return json.load(f)


def merge_checkout_sources() -> dict:
    val_data = load_coco(RPC_ROOT / "instances_val2019.json")
    test_data = load_coco(RPC_ROOT / "instances_test2019.json")

    # Sanity check: both must share the same category taxonomy before merging
    val_cat_ids = {c["id"] for c in val_data["categories"]}
    test_cat_ids = {c["id"] for c in test_data["categories"]}
    assert val_cat_ids == test_cat_ids, "val/test category IDs don't match — do not merge blindly"

    max_img_id = max(img["id"] for img in val_data["images"])
    max_ann_id = max(ann["id"] for ann in val_data["annotations"])

    # Offset test image/annotation IDs so nothing collides after merge.
    # NOTE: this assumes val2019 images live in a 'val2019/' folder and
    # test2019 images live in 'test2019/' — confirm folder names before
    # running, since file_name fields need the right subfolder prefix.
    for img in test_data["images"]:
        img["id"] += max_img_id + 1
        if not img["file_name"].startswith("test2019/"):
            img["file_name"] = f"test2019/{img['file_name']}"
    for img in val_data["images"]:
        if not img["file_name"].startswith("val2019/"):
            img["file_name"] = f"val2019/{img['file_name']}"

    for ann in test_data["annotations"]:
        ann["id"] += max_ann_id + 1
        ann["image_id"] += max_img_id + 1

    return {
        "images": val_data["images"] + test_data["images"],
        "annotations": val_data["annotations"] + test_data["annotations"],
        "categories": val_data["categories"],
    }


def split_and_write(merged: dict):
    random.seed(SEED)
    images = merged["images"][:]
    random.shuffle(images)

    n = len(images)
    n_train = int(n * SPLIT_RATIOS["train"])
    n_val = int(n * SPLIT_RATIOS["val"])

    splits = {
        "train": images[:n_train],
        "val": images[n_train:n_train + n_val],
        "test": images[n_train + n_val:],
    }

    ann_by_image = {}
    for ann in merged["annotations"]:
        ann_by_image.setdefault(ann["image_id"], []).append(ann)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for split_name, split_images in splits.items():
        image_ids = {img["id"] for img in split_images}
        split_anns = [a for img_id in image_ids for a in ann_by_image.get(img_id, [])]
        out = {
            "images": split_images,
            "annotations": split_anns,
            "categories": merged["categories"],
        }
        out_path = OUTPUT_DIR / f"instances_{split_name}.json"
        with open(out_path, "w") as f:
            json.dump(out, f)
        print(f"{split_name}: {len(split_images)} images, {len(split_anns)} annotations -> {out_path}")


if __name__ == "__main__":
    merged = merge_checkout_sources()
    print(f"Merged checkout-domain pool: {len(merged['images'])} images")
    split_and_write(merged)