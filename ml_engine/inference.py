import os
import sys
import torch
from torchvision.transforms import functional as F
from PIL import Image
import numpy as np

# Add ml_engine to path for importing local modules
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from models.crowd_model import CrowdCounterCNN
from models.retail_model import get_retail_model

class AttentionInference:
    """
    Unified Inference API for the Consumer Attention Mapping System.
    Wraps both the crowd counting model and retail product detection model.
    """
    def __init__(self, crowd_weights=None, retail_weights=None, num_retail_classes=115):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        print(f"Initializing Inference API on {self.device}")
        
        # Load Crowd Model
        self.crowd_model = CrowdCounterCNN(pretrained=False).to(self.device)
        if crowd_weights and os.path.exists(crowd_weights):
            self.crowd_model.load_state_dict(torch.load(crowd_weights, map_location=self.device))
        else:
            print("Warning: Initializing crowd model with random weights (no checkpoint provided)")
        self.crowd_model.eval()
        
        # Load Retail Model
        self.retail_model = get_retail_model(num_retail_classes, pretrained=False).to(self.device)
        if retail_weights and os.path.exists(retail_weights):
            self.retail_model.load_state_dict(torch.load(retail_weights, map_location=self.device))
        else:
            print("Warning: Initializing retail model with random weights (no checkpoint provided)")
        self.retail_model.eval()
        
    @torch.no_grad()
    def predict(self, image_input, conf_threshold=0.5):
        """
        Runs both models on the input image.
        image_input: path to image, PIL Image, or numpy array.
        Returns dictionary with crowd count and list of retail bounding boxes.
        """
        if isinstance(image_input, str):
            img = Image.open(image_input).convert("RGB")
        elif isinstance(image_input, np.ndarray):
            img = Image.fromarray(image_input).convert("RGB")
        elif isinstance(image_input, Image.Image):
            img = image_input
        else:
            raise ValueError("Unsupported image type")

        img_tensor = F.to_tensor(img).to(self.device)
        batch_tensor = img_tensor.unsqueeze(0) # Add batch dim
        
        # Crowd Prediction
        crowd_pred = self.crowd_model(batch_tensor)
        count = max(0, int(round(crowd_pred.item()))) # ensure non-negative integer
        
        # Retail Prediction
        retail_preds = self.retail_model(batch_tensor)[0]
        
        # Filter by confidence
        keep = retail_preds['scores'] > conf_threshold
        boxes = retail_preds['boxes'][keep].cpu().numpy().tolist()
        labels = retail_preds['labels'][keep].cpu().numpy().tolist()
        scores = retail_preds['scores'][keep].cpu().numpy().tolist()
        
        retail_results = [
            {"box": box, "label": label, "score": score}
            for box, label, score in zip(boxes, labels, scores)
        ]
        
        return {
            "crowd_count": count,
            "retail_products": retail_results
        }

if __name__ == "__main__":
    print("Testing Inference API...")
    inferencer = AttentionInference()
    
    # Create dummy image
    dummy_img = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
    
    results = inferencer.predict(dummy_img)
    print("\nInference Results:")
    print(f"Predicted Crowd Count: {results['crowd_count']}")
    print(f"Detected Retail Products: {len(results['retail_products'])}")
