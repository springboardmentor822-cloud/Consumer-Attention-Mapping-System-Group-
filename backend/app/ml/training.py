import os
import logging
from app.ml.train_retail_detector import train_retail_model

logger = logging.getLogger("ml_training_interface")

class ModelTrainer:
    def __init__(self, dataset_name: str):
        self.dataset_name = dataset_name
        self.yaml_mapping = {
            "SKU110K": "backend/datasets/sku110k.yaml",
            "RPC": "backend/datasets/rpc.yaml",
            "COCO": "backend/datasets/coco128.yaml"
        }

    def train(self, epochs: int = 5, batch_size: int = 16, resume: bool = False, device: str = "cpu") -> str:
        logger.info(f"Triggering model training pipeline for: {self.dataset_name}")
        yaml_path = self.yaml_mapping.get(self.dataset_name, "backend/datasets/sku110k.yaml")
        
        success = train_retail_model(
            dataset_yaml=yaml_path,
            epochs=epochs,
            batch_size=batch_size,
            resume=resume,
            device=device
        )
        
        if success:
            return "Model trained successfully"
        else:
            raise RuntimeError("Retail YOLO model training failed.")
