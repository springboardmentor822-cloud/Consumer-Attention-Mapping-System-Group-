import unittest
from app.services.segmentation_service import ShopperSegmentationEngine

class TestSegmentation(unittest.TestCase):
    def test_kmeans_segmentation(self):
        engine = ShopperSegmentationEngine()
        res = engine.classify_shopper_session(
            path_length=150.0,
            dwell_time=200.0,
            pickups=1,
            returns=0,
            converted=False
        )
        self.assertEqual(res["segment"], "Explorers")

        res_quick = engine.classify_shopper_session(
            path_length=40.0,
            dwell_time=45.0,
            pickups=2,
            returns=0,
            converted=True
        )
        self.assertEqual(res_quick["segment"], "Quick Buyers")

if __name__ == "__main__":
    unittest.main()
