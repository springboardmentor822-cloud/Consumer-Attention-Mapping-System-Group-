import os
import torch
import torch.optim as optim
import random
from torch.utils.data import DataLoader, random_split, Subset
from datasets.retail_dataset import RetailProductDataset
from models.retail_model import get_retail_model
from tqdm import tqdm

def collate_fn(batch):
    return tuple(zip(*batch))

def train():
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Using device: {device}")
    
    dataset_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../dataset/retail product'))
    if not os.path.exists(dataset_dir):
        print(f"Dataset not found at {dataset_dir}")
        return

    full_train_dataset = RetailProductDataset(dataset_dir, split='train2019')
    full_val_dataset = RetailProductDataset(dataset_dir, split='val2019')
    
    if len(full_train_dataset) == 0:
        print("Dataset is empty. Aborting training.")
        return
        
    # Reduced to 2% to ensure it finishes within a few hours on CPU for the milestone.
    SUBSET_FRACTION = 0.02
    
    # Randomly select a 5% subset of training data
    train_subset_size = int(SUBSET_FRACTION * len(full_train_dataset))
    train_indices = random.sample(range(len(full_train_dataset)), train_subset_size)
    train_dataset = Subset(full_train_dataset, train_indices)
    
    # Randomly select a 5% subset of validation data
    val_subset_size = int(SUBSET_FRACTION * len(full_val_dataset))
    val_indices = random.sample(range(len(full_val_dataset)), val_subset_size)
    val_dataset = Subset(full_val_dataset, val_indices)
    
    print(f"Using {train_subset_size} training images and {val_subset_size} validation images ({SUBSET_FRACTION*100}% subset).")
        
    train_loader = DataLoader(train_dataset, batch_size=4, shuffle=True, num_workers=2, collate_fn=collate_fn)
    val_loader = DataLoader(val_dataset, batch_size=4, shuffle=False, num_workers=2, collate_fn=collate_fn)
    
    # Dynamically find max class ID for dense detection (e.g., SKU-110K might use arbitrary IDs)
    if full_train_dataset.coco:
        max_cat_id = max(full_train_dataset.coco.getCatIds())
        num_classes = max_cat_id + 1
    else:
        num_classes = 115 # Fallback

    model = get_retail_model(num_classes, pretrained=True).to(device)
    
    # Accurate Training: AdamW with weight decay
    optimizer = optim.AdamW(model.parameters(), lr=1e-4, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=3, gamma=0.1)
    
    epochs = 3
    best_val_loss = float('inf')
    os.makedirs('weights', exist_ok=True)
    
    checkpoint_path = 'weights/retail_model_latest.pth'
    start_epoch = 0
    start_step = 0
    
    if os.path.exists(checkpoint_path):
        print(f"Resuming from checkpoint: {checkpoint_path}")
        try:
            checkpoint = torch.load(checkpoint_path, map_location=device)
            model.load_state_dict(checkpoint['model_state_dict'])
            optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
            scheduler.load_state_dict(checkpoint['scheduler_state_dict'])
            start_epoch = checkpoint['epoch']
            start_step = checkpoint['step']
            best_val_loss = checkpoint.get('best_val_loss', float('inf'))
            print(f"Resumed at Epoch {start_epoch+1}, Step {start_step}")
        except Exception as e:
            print(f"Failed to load checkpoint: {e}")

    print("Starting robust fine-tuning for Retail Product model...")
    
    for epoch in range(start_epoch, epochs):
        model.train()
        running_loss = 0.0
        
        pbar = tqdm(train_loader, desc=f"Epoch [{epoch+1}/{epochs}]", dynamic_ncols=True)
        for batch_idx, (images, targets) in enumerate(pbar):
            # Fast-forward if resuming mid-epoch
            if epoch == start_epoch and batch_idx < start_step:
                continue

            images = list(image.to(device) for image in images)
            targets = [{k: v.to(device) for k, v in t.items()} for t in targets]
            
            loss_dict = model(images, targets)
            losses = sum(loss for loss in loss_dict.values())
            
            optimizer.zero_grad()
            losses.backward()
            
            # Gradient clipping to prevent exploding gradients in Faster R-CNN
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            
            optimizer.step()
            running_loss += losses.item()
            
            pbar.set_postfix({'Train Loss': f"{losses.item():.4f}"})
            
            # Save a checkpoint every 200 steps to prevent progress loss
            if (batch_idx + 1) % 200 == 0:
                torch.save({
                    'epoch': epoch,
                    'step': batch_idx + 1,
                    'model_state_dict': model.state_dict(),
                    'optimizer_state_dict': optimizer.state_dict(),
                    'scheduler_state_dict': scheduler.state_dict(),
                    'best_val_loss': best_val_loss
                }, checkpoint_path)
                
        # calculate denominator properly for training loss
        effective_len = len(train_loader) - (start_step if epoch == start_epoch else 0)
        epoch_train_loss = running_loss / max(1, effective_len)
        
        # Reset start_step for subsequent epochs
        if epoch == start_epoch:
            start_step = 0
        
        # Validation Loop (using training mode on validation set to get losses)
        # Note: torchvision Faster R-CNN behaves differently in eval() mode.
        # It requires targets to compute losses, which it only does in train() mode.
        val_loss = 0.0
        with torch.no_grad():
            for images, targets in val_loader:
                images = list(image.to(device) for image in images)
                targets = [{k: v.to(device) for k, v in t.items()} for t in targets]
                
                loss_dict = model(images, targets)
                batch_val_loss = sum(loss for loss in loss_dict.values())
                val_loss += batch_val_loss.item()
                
        epoch_val_loss = val_loss / len(val_loader)
        scheduler.step()
        
        print(f"Epoch [{epoch+1}/{epochs}] - Avg Train Loss: {epoch_train_loss:.4f} - Avg Val Loss: {epoch_val_loss:.4f}")

        # Checkpointing
        # Save latest at end of epoch to safely cross epochs
        torch.save({
            'epoch': epoch + 1,
            'step': 0,
            'model_state_dict': model.state_dict(),
            'optimizer_state_dict': optimizer.state_dict(),
            'scheduler_state_dict': scheduler.state_dict(),
            'best_val_loss': best_val_loss
        }, checkpoint_path)

        if epoch_val_loss < best_val_loss:
            best_val_loss = epoch_val_loss
            torch.save(model.state_dict(), 'weights/retail_model_best.pth')
            print(f" -> Best model saved at epoch {epoch+1}")

    print("Training complete. Best weights saved to weights/retail_model_best.pth")

if __name__ == '__main__':
    train()
