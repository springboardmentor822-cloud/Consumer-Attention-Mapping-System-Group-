import os
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, random_split
from datasets.crowd_dataset import CrowdDataset
from models.crowd_model import CrowdCounterCNN

def train():
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Using device: {device}")
    
    dataset_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../dataset/crowd count'))
    if not os.path.exists(dataset_dir):
        print(f"Dataset not found at {dataset_dir}")
        return

    # Load dataset
    full_dataset = CrowdDataset(dataset_dir)
    if len(full_dataset) == 0:
        print("Dataset is empty. Aborting training.")
        return
        
    # Accurate Training: Proper train/val split (80/20)
    train_size = int(0.8 * len(full_dataset))
    val_size = len(full_dataset) - train_size
    train_dataset, val_dataset = random_split(full_dataset, [train_size, val_size])
    
    train_loader = DataLoader(train_dataset, batch_size=16, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=16, shuffle=False, num_workers=0)
    
    model = CrowdCounterCNN(pretrained=True).to(device)
    criterion = nn.MSELoss()
    
    # Accurate Training: AdamW optimizer and StepLR
    optimizer = optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=5, gamma=0.1)
    
    epochs = 15
    best_val_loss = float('inf')
    os.makedirs('weights', exist_ok=True)
    
    print("Starting accurate training for Crowd Counter...")
    for epoch in range(epochs):
        model.train()
        running_loss = 0.0
        
        for batch_idx, (images, labels) in enumerate(train_loader):
            images = images.to(device)
            labels = labels.to(device).squeeze(-1)
            
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            
            # Gradient clipping to stabilize regression
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=2.0)
            
            optimizer.step()
            running_loss += loss.item()
            
        epoch_train_loss = running_loss / len(train_loader)
        
        # Validation Loop
        model.eval()
        val_loss = 0.0
        with torch.no_grad():
            for images, labels in val_loader:
                images = images.to(device)
                labels = labels.to(device).squeeze(-1)
                outputs = model(images)
                loss = criterion(outputs, labels)
                val_loss += loss.item()
                
        epoch_val_loss = val_loss / len(val_loader)
        scheduler.step()
        
        print(f"Epoch [{epoch+1}/{epochs}] - Train Loss: {epoch_train_loss:.4f} - Val Loss: {epoch_val_loss:.4f}")
        
        # Best model checkpointing
        if epoch_val_loss < best_val_loss:
            best_val_loss = epoch_val_loss
            torch.save(model.state_dict(), 'weights/crowd_model_best.pth')
            print(f" -> Best model saved at epoch {epoch+1}")
            
    print("Training complete. Best weights saved to weights/crowd_model_best.pth")

if __name__ == '__main__':
    train()
