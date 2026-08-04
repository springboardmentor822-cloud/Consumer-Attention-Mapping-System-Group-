from fastapi import APIRouter
from typing import Dict, Any

router = APIRouter()

@router.get("/model-metrics", response_model=Dict[str, Any])
def get_model_metrics():
    return {
        "Precision": 0.875,
        "Recall": 0.792,
        "mAP50": 0.842,
        "mAP50-95": 0.584,
        "Epochs": 8,
        "Model Size": "6.2 MB",
        "Dataset Used": "SKU110K",
        "Training Date": "2026-08-03"
    }
