import json
from pathlib import Path

split_dir = Path(r"C:\Users\ritik\Downloads\Consumer Attention Mapping\backend\data\rpc\retail_product_checkout\checkout_only_split")
train = json.load(open(split_dir / "instances_train.json"))
val = json.load(open(split_dir / "instances_val.json"))


def scene_prefix(fname):
    stem = Path(fname).stem
    parts = stem.split("-")
    return "-".join(parts[:-1]) if len(parts) > 1 else stem


train_scenes = {scene_prefix(img["file_name"]) for img in train["images"]}
val_scenes = {scene_prefix(img["file_name"]) for img in val["images"]}

overlap = train_scenes & val_scenes
print(f"train scenes: {len(train_scenes)}, val scenes: {len(val_scenes)}, overlapping scenes: {len(overlap)}")
if overlap:
    print("example overlapping scene prefixes:", list(overlap)[:10])
