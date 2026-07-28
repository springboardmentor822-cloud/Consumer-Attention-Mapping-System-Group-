import os
import numpy as np
import pandas as pd
from PIL import Image
import torch
from torch.utils.data import Dataset
import torchvision.transforms as transforms

class CrowdDataset(Dataset):
    """
    Dataset loader for Crowd Counting.
    Assumes `images.npy` (or a folder of frames) and `labels.npy`/`labels.csv` 
    exist in the provided dataset_dir.
    """
    def __init__(self, dataset_dir, transform=None):
        self.dataset_dir = dataset_dir
        self.transform = transform
        
        # Load data
        images_path = os.path.join(dataset_dir, 'images.npy')
        labels_path = os.path.join(dataset_dir, 'labels.npy')
        csv_path = os.path.join(dataset_dir, 'labels.csv')
        
        if os.path.exists(images_path):
            self.images = np.load(images_path)
            self.mode = 'numpy'
        else:
            self.frames_dir = os.path.join(dataset_dir, 'frames')
            self.images = sorted([f for f in os.listdir(self.frames_dir) if f.endswith(('.jpg', '.png'))])
            self.mode = 'frames'
            
        if os.path.exists(labels_path):
            self.labels = np.load(labels_path)
            self.has_dense_labels = True
        else:
            self.labels = pd.read_csv(csv_path) if os.path.exists(csv_path) else None
            self.has_dense_labels = False

    def __len__(self):
        return len(self.images)

    def __getitem__(self, idx):
        if self.mode == 'numpy':
            image = self.images[idx]
            # Convert to PIL Image for standard torchvision transforms
            if isinstance(image, np.ndarray):
                if image.shape[-1] == 3: # HWC
                    image = Image.fromarray(image.astype('uint8'))
                else: # assumed CHW
                    image = Image.fromarray(np.transpose(image, (1, 2, 0)).astype('uint8'))
        else:
            img_path = os.path.join(self.frames_dir, self.images[idx])
            image = Image.open(img_path).convert("RGB")
            
        if self.has_dense_labels:
            label = self.labels[idx]
            label = torch.from_numpy(label).float()
        else:
            # Fallback to counts if density map isn't available
            label = torch.tensor(self.labels.iloc[idx]['count']).float() if self.labels is not None else torch.tensor(0.0).float()

        if self.transform:
            image = self.transform(image)
        elif isinstance(image, Image.Image):
            image = transforms.ToTensor()(image)

        return image, label
