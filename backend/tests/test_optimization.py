import unittest
from app.services.optimization_engine import MerchandisingOptimizationEngine

class TestOptimization(unittest.TestCase):
    def test_evaluate_product_optimizations(self):
        scored_products = [
            {
                "sku": "SKU-999",
                "name": "Overpriced Chips",
                "shelf": "Shelf A",
                "shelf_tier": "Bottom Shelf",
                "attractiveness_score": 85.0,
                "raw_attention": 85.0,
                "raw_pickup_rate": 0.20,
                "raw_conversion_rate": 0.15
            }
        ]

        recommendations = MerchandisingOptimizationEngine.evaluate_product_optimizations(scored_products)
        self.assertGreaterEqual(len(recommendations), 2)
        categories = [r["category"] for r in recommendations]
        self.assertIn("Price & Packaging Review", categories)
        self.assertIn("Eye-Level Relocation", categories)

if __name__ == "__main__":
    unittest.main()
