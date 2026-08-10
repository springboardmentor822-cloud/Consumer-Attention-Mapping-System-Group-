import unittest
from app.services.attractiveness_service import AttractivenessScoringEngine

class TestAttractiveness(unittest.TestCase):
    def test_calculate_category_scores(self):
        raw_products = [
            {
                "sku": "SKU-001",
                "name": "Energy Drink A",
                "raw_attention": 90.0,
                "raw_interaction": 50,
                "raw_pickup_rate": 0.8,
                "raw_conversion_rate": 0.7,
                "raw_repeat_rate": 0.3,
                "shelf_tier": "Eye Level"
            },
            {
                "sku": "SKU-002",
                "name": "Soda B",
                "raw_attention": 30.0,
                "raw_interaction": 10,
                "raw_pickup_rate": 0.2,
                "raw_conversion_rate": 0.1,
                "raw_repeat_rate": 0.05,
                "shelf_tier": "Bottom Shelf"
            }
        ]

        results = AttractivenessScoringEngine.calculate_category_scores(raw_products)
        self.assertEqual(len(results), 2)
        top = results[0]
        self.assertEqual(top["sku"], "SKU-001")
        self.assertGreater(top["attractiveness_score"], results[1]["attractiveness_score"])
        self.assertEqual(top["norm_attention"], 100.0)
        self.assertEqual(results[1]["norm_attention"], 0.0)

if __name__ == "__main__":
    unittest.main()
