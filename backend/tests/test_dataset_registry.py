import pytest
import os
from app.ml.dataset_registry import DatasetRegistry

def test_registry_resolution():
    # Verify logical mapping works for all expected keys
    expected_keys = ["COCO", "SKU110K", "RPC", "RETAIL_ACTION", "MOT17"]
    
    for key in expected_keys:
        path = DatasetRegistry.get_path(key)
        assert path is not None
        assert isinstance(path, str)
        assert os.path.isabs(path)
        assert key in DatasetRegistry.list_datasets()

def test_registry_invalid_key():
    # Verify that invalid keys raise KeyError
    with pytest.raises(KeyError):
        DatasetRegistry.get_path("INVALID_DATASET_NAME")

def test_registry_list_datasets():
    # Verify list_datasets method
    datasets = DatasetRegistry.list_datasets()
    assert isinstance(datasets, list)
    assert len(datasets) == 5
    assert "COCO" in datasets
