import os
from typing import Dict, List

class DatasetRegistry:
    PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    
    MAPPING: Dict[str, str] = {
        "COCO": "backend/datasets/coco128",
        "SKU110K": "backend/datasets/SKU110K",
        "RPC": "backend/datasets/RPC",
        "RETAIL_ACTION": "backend/datasets/RetailAction",
        "MOT17": "backend/datasets/MOT17"
    }

    @classmethod
    def get_path(cls, dataset_name: str) -> str:
        if dataset_name not in cls.MAPPING:
            raise KeyError(f"Dataset '{dataset_name}' is not registered in DatasetRegistry.")
        return os.path.abspath(os.path.join(cls.PROJECT_ROOT, cls.MAPPING[dataset_name]))

    @classmethod
    def get_all_paths(cls) -> Dict[str, str]:
        return {name: cls.get_path(name) for name in cls.MAPPING}

    @classmethod
    def list_datasets(cls) -> List[str]:
        return list(cls.MAPPING.keys())
