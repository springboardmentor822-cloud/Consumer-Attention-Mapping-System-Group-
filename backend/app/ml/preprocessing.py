import os
import random
from typing import List, Dict, Any
from app.ml.dataset_registry import DatasetRegistry

class DatasetLoader:
    def __init__(self, dataset_path: str = None):
        self.dataset_path = dataset_path

    def load_coco(self) -> Dict[str, Any]:
        import json
        try:
            coco_dir = DatasetRegistry.get_path("COCO")
            ann_file = os.path.join(coco_dir, "annotations", "instances_val2017.json")
            if os.path.exists(ann_file):
                with open(ann_file, 'r') as f:
                    return json.load(f)
        except Exception:
            pass
        return {"images": [], "annotations": [], "categories": []}

    def load_retail_traffic(self) -> List[Dict[str, Any]]:
        return []

    @staticmethod
    def train_val_split(data: list, split_ratio: float = 0.8) -> tuple:
        random.seed(42)
        shuffled = list(data)
        random.shuffle(shuffled)
        split_idx = int(len(shuffled) * split_ratio)
        return shuffled[:split_idx], shuffled[split_idx:]

    def enumerate_all_datasets(self) -> Dict[str, Dict[str, int]]:
        report = {}
        
        # 1. COCO (coco128)
        try:
            coco_dir = DatasetRegistry.get_path("COCO")
        except KeyError:
            coco_dir = ""

        if coco_dir and os.path.exists(coco_dir):
            train_img_dir = os.path.join(coco_dir, "images", "train2017")
            train_lbl_dir = os.path.join(coco_dir, "labels", "train2017")
            
            train_imgs = os.listdir(train_img_dir) if os.path.exists(train_img_dir) else []
            train_lbls = os.listdir(train_lbl_dir) if os.path.exists(train_lbl_dir) else []
            
            img_stems = {os.path.splitext(f)[0] for f in train_imgs if f.lower().endswith(('.jpg', '.jpeg', '.png'))}
            lbl_stems = {os.path.splitext(f)[0] for f in train_lbls if f.lower().endswith('.txt')}
            
            missing_lbls = len(img_stems - lbl_stems)
            missing_imgs = len(lbl_stems - img_stems)
            
            report["coco128"] = {
                "train_image_count": len(img_stems),
                "validation_image_count": 0,
                "annotation_count": len(lbl_stems),
                "missing_file_count": missing_lbls + missing_imgs
            }

        # 2. SKU-110K (SKU110K)
        try:
            sku_base = DatasetRegistry.get_path("SKU110K")
            sku_dir = os.path.join(sku_base, "SKU110K_fixed")
        except KeyError:
            sku_dir = ""

        if sku_dir and os.path.exists(sku_dir):
            img_dir = os.path.join(sku_dir, "images")
            annot_dir = os.path.join(sku_dir, "annotations")
            
            imgs = os.listdir(img_dir) if os.path.exists(img_dir) else []
            train_imgs = [f for f in imgs if f.startswith("train_")]
            val_imgs = [f for f in imgs if f.startswith("val_")]
            test_imgs = [f for f in imgs if f.startswith("test_")]
            
            annots = os.listdir(annot_dir) if os.path.exists(annot_dir) else []
            csv_annots = [f for f in annots if f.endswith(".csv")]
            
            report["SKU110K"] = {
                "train_image_count": len(train_imgs),
                "validation_image_count": len(val_imgs),
                "annotation_count": len(csv_annots),
                "missing_file_count": 0
            }

        # 3. Retail Product Checkout (RPC)
        try:
            rpc_dir = DatasetRegistry.get_path("RPC")
        except KeyError:
            rpc_dir = ""

        if rpc_dir and os.path.exists(rpc_dir):
            test_dir = os.path.join(rpc_dir, "test2019")
            test_imgs = os.listdir(test_dir) if os.path.exists(test_dir) else []
            
            report["RPC"] = {
                "train_image_count": 0,
                "validation_image_count": 0,
                "annotation_count": 0,
                "missing_file_count": 0
            }

        # 4. MOT17
        try:
            mot_base = DatasetRegistry.get_path("MOT17")
            mot_dir = os.path.join(mot_base, "MOT17")
        except KeyError:
            mot_dir = ""

        if mot_dir and os.path.exists(mot_dir):
            train_img_dir = os.path.join(mot_dir, "images", "train")
            test_img_dir = os.path.join(mot_dir, "images", "test")
            annot_dir = os.path.join(mot_dir, "annotations")
            
            train_count = 0
            if os.path.exists(train_img_dir):
                for seq in os.listdir(train_img_dir):
                    seq_img_dir = os.path.join(train_img_dir, seq, "img1")
                    if os.path.exists(seq_img_dir):
                        train_count += len([f for f in os.listdir(seq_img_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))])
                        
            val_count = 0
            if os.path.exists(test_img_dir):
                for seq in os.listdir(test_img_dir):
                    seq_img_dir = os.path.join(test_img_dir, seq, "img1")
                    if os.path.exists(seq_img_dir):
                        val_count += len([f for f in os.listdir(seq_img_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))])
            
            annot_count = len(os.listdir(annot_dir)) if os.path.exists(annot_dir) else 0
            
            report["MOT17"] = {
                "train_image_count": train_count,
                "validation_image_count": val_count,
                "annotation_count": annot_count,
                "missing_file_count": 0
            }

        # 5. RetailAction
        try:
            ra_dir = DatasetRegistry.get_path("RETAIL_ACTION")
        except KeyError:
            ra_dir = ""

        if ra_dir and os.path.exists(ra_dir):
            annot_count = 0
            video_count = 0
            for root, dirs, files in os.walk(ra_dir):
                for f in files:
                    if f.endswith(".json"):
                        annot_count += 1
                    elif f.endswith(".mp4"):
                        video_count += 1
            report["RetailAction"] = {
                "train_image_count": 0,
                "validation_image_count": 0,
                "annotation_count": annot_count,
                "missing_file_count": 0
            }

        return report
