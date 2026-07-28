import torch
import torchvision.models.detection as detection
from torchvision.models.detection.faster_rcnn import FastRCNNPredictor

def get_retail_model(num_classes, pretrained=True):
    """
    Creates a Faster R-CNN model with a ResNet-50-FPN backbone.
    Fine-tunes the predictor head for the specified number of classes.
    num_classes should include the background class (e.g., actual_classes + 1).
    """
    # Load a model pre-trained on COCO
    weights = detection.FasterRCNN_ResNet50_FPN_Weights.DEFAULT if pretrained else None
    # trainable_backbone_layers=0 completely freezes the heavy ResNet50 backbone,
    # meaning the CPU only has to train the final prediction head. This saves ~70% training time.
    model = detection.fasterrcnn_resnet50_fpn(weights=weights, trainable_backbone_layers=0)

    # Get number of input features for the classifier
    in_features = model.roi_heads.box_predictor.cls_score.in_features
    
    # Replace the pre-trained head with a new one
    model.roi_heads.box_predictor = FastRCNNPredictor(in_features, num_classes)
    
    return model
