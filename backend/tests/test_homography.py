import unittest
import numpy as np
from app.services.heatmap_engine import HomographyHeatmapEngine

class TestHomography(unittest.TestCase):
    def test_homography_perspective_transform(self):
        engine = HomographyHeatmapEngine()
        x_p, y_p = engine.transform_camera_to_planogram(100.0, 100.0)
        self.assertGreaterEqual(x_p, 0.0)
        self.assertLessEqual(x_p, 100.0)
        self.assertGreaterEqual(y_p, 0.0)
        self.assertLessEqual(y_p, 100.0)

if __name__ == "__main__":
    unittest.main()
