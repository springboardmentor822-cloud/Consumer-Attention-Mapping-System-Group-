import os
import torch
from torch.utils.data import Dataset
from PIL import Image
import torchvision.transforms as transforms
try:
    from pycocotools.coco import COCO
except ImportError:
    COCO = None
    print("Warning: pycocotools is not installed. RetailDataset will not work properly.")

class RetailProductDataset(Dataset):
    """
    COCO format dataset loader for Retail Product detection.
    """
    def __init__(self, dataset_dir, split='train2019', transform=None):
        self.dataset_dir = dataset_dir
        self.split = split
        self.transform = transform
        
        self.img_dir = os.path.join(dataset_dir, split)
        self.ann_file = os.path.join(dataset_dir, f'instances_{split}.json')
        
        if COCO is not None and os.path.exists(self.ann_file):
            self.coco = COCO(self.ann_file)
            self.ids = list(self.coco.imgs.keys())
        else:
            self.coco = None
            self.ids = []
            
    def __len__(self):
        return len(self.ids)

    def __getitem__(self, idx):
        if self.coco is None:
            raise RuntimeError("pycocotools not installed or annotation file missing.")
            
        img_id = self.ids[idx]
        ann_ids = self.coco.getAnnIds(imgIds=img_id)
        anns = self.coco.loadAnns(ann_ids)
        
        img_info = self.coco.loadImgs(img_id)[0]
        img_path = os.path.join(self.img_dir, img_info['file_name'])
        
        image = Image.open(img_path).convert("RGB")
        
        # Parse bounding boxes
        boxes = []
        labels = []
        for ann in anns:
            # COCO bbox format is [x_min, y_min, width, height]
            x, y, w, h = ann['bbox']
            boxes.append([x, y, x + w, y + h]) # Convert to [x1, y1, x2, y2]
            labels.append(ann['category_id'])
            
        boxes = torch.as_tensor(boxes, dtype=torch.float32)
        labels = torch.as_tensor(labels, dtype=torch.int64)
        
        target = {}
        target["boxes"] = boxes
        target["labels"] = labels
        target["image_id"] = torch.tensor([img_id])
        
        if self.transform:
            image = self.transform(image)
        elif isinstance(image, Image.Image):
            image = transforms.ToTensor()(image)

        return image, target
