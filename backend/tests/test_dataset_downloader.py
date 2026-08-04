import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
from scripts.download_datasets import DATASET_URLS

def test_dataset_urls():
    assert "coco" in DATASET_URLS
    assert "sku-110k" in DATASET_URLS
    assert "retail-checkout" in DATASET_URLS
    assert DATASET_URLS["coco"].endswith(".zip")
