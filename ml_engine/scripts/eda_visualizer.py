import sys
import os

# Add ml_engine to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np

try:
    from datasets.crowd_dataset import CrowdDataset
    from datasets.retail_dataset import RetailProductDataset
except ImportError as e:
    print(f"Error importing datasets: {e}")
    sys.exit(1)

def visualize_crowd(dataset_path):
    print("Loading Crowd Dataset...")
    try:
        dataset = CrowdDataset(dataset_path)
        if len(dataset) == 0:
            print("Crowd Dataset is empty.")
            return

        img, label = dataset[0]
        
        # img is shape (C, H, W) float tensor
        if img.ndim == 3 and img.shape[0] in [1, 3]:
            img_np = img.permute(1, 2, 0).numpy()
        else:
            img_np = img.numpy()
        
        fig, ax = plt.subplots(1, 2, figsize=(10, 5))
        ax[0].imshow(img_np)
        ax[0].set_title("Input Image")
        ax[0].axis('off')
        
        # label can be a density map or a count
        if label.ndim > 1 and label.numel() > 1:
            if label.ndim == 3 and label.shape[0] == 1:
                label_img = label.squeeze(0).numpy()
            else:
                label_img = label.numpy()
            ax[1].imshow(label_img, cmap='jet', alpha=0.8)
            ax[1].set_title(f"Density Map (Sum={label.sum().item():.2f})")
        else:
            ax[1].text(0.5, 0.5, f"Count: {label.item()}", fontsize=15, ha='center')
            ax[1].set_title("Crowd Count Label")
        ax[1].axis('off')
        
        save_path = "crowd_sample.png"
        plt.savefig(save_path)
        print(f"Saved crowd sample to {save_path}")
        plt.close()
    except Exception as e:
        print(f"Failed to visualize crowd dataset: {e}")

def visualize_retail(dataset_path):
    print("Loading Retail Product Dataset...")
    try:
        dataset = RetailProductDataset(dataset_path, split='train2019')
        if len(dataset) == 0:
            print("Retail Dataset is empty (or train2019 not found).")
            return
            
        img, target = dataset[0]
        
        if img.ndim == 3 and img.shape[0] in [1, 3]:
            img_np = img.permute(1, 2, 0).numpy()
        else:
            img_np = img.numpy()
        
        fig, ax = plt.subplots(1, figsize=(8, 8))
        ax.imshow(img_np)
        
        boxes = target['boxes'].numpy()
        labels = target['labels'].numpy()
        
        for box, label in zip(boxes, labels):
            xmin, ymin, xmax, ymax = box
            width = xmax - xmin
            height = ymax - ymin
            rect = patches.Rectangle((xmin, ymin), width, height, linewidth=2, edgecolor='r', facecolor='none')
            ax.add_patch(rect)
            ax.text(xmin, ymin, str(label), color='red', fontsize=10, backgroundcolor='white')
            
        ax.set_title("Retail Product Sample")
        ax.axis('off')
        
        save_path = "retail_sample.png"
        plt.savefig(save_path)
        print(f"Saved retail sample to {save_path}")
        plt.close()
    except Exception as e:
        print(f"Failed to visualize retail dataset: {e}")

if __name__ == "__main__":
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../dataset'))
    crowd_dir = os.path.join(base_dir, 'crowd count')
    retail_dir = os.path.join(base_dir, 'retail product')
    
    if os.path.exists(crowd_dir):
        visualize_crowd(crowd_dir)
    else:
        print(f"Crowd directory not found at {crowd_dir}")
        
    if os.path.exists(retail_dir):
        visualize_retail(retail_dir)
    else:
        print(f"Retail directory not found at {retail_dir}")
