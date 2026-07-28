import torch
import torch.nn as nn
import torchvision.models as models

class CrowdCounterCNN(nn.Module):
    """
    A lightweight CNN for predicting scalar crowd counts from images.
    Uses a pretrained MobileNetV3 small backbone for feature extraction,
    followed by a regression head.
    """
    def __init__(self, pretrained=True):
        super(CrowdCounterCNN, self).__init__()
        # Use MobileNetV3 small for fast inference
        weights = models.MobileNet_V3_Small_Weights.DEFAULT if pretrained else None
        backbone = models.mobilenet_v3_small(weights=weights)
        
        # Remove the original classification head
        self.features = backbone.features
        self.pool = nn.AdaptiveAvgPool2d(1)
        
        # New regression head
        self.regressor = nn.Sequential(
            nn.Linear(576, 128),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(128, 1)
        )

    def forward(self, x):
        x = self.features(x)
        x = self.pool(x)
        x = torch.flatten(x, 1)
        count = self.regressor(x)
        return count.squeeze(-1) # return shape (batch_size,)
