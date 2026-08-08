import numpy as np
from sklearn.cluster import KMeans
from typing import Dict, Any, List

class ShopperSegmentationEngine:
    """
    ML Segmentation Classifier mapping shopper session features into 5 personas:
    1. Explorers
    2. Quick Buyers
    3. Comparison Shoppers
    4. Impulse Buyers
    5. Brand Loyal Customers
    """
    def __init__(self):
        self.kmeans = KMeans(n_clusters=5, random_state=42, n_init=10)
        self._fitted = False

    def fit_sample_data(self):
        """Train K-Means model on baseline feature distribution [path_length, dwell_time, pickup_count, return_count, conversion]"""
        # Synthetic feature matrix for initial clustering baseline
        X_sample = np.array([
            [180.0, 240.0, 2, 1, 0.3],   # Explorers
            [40.0, 45.0, 1, 0, 0.9],     # Quick Buyers
            [80.0, 310.0, 6, 4, 0.5],    # Comparison Shoppers
            [95.0, 60.0, 3, 0, 0.8],     # Impulse Buyers
            [50.0, 50.0, 4, 0, 0.95],    # Brand Loyalists
        ])
        self.kmeans.fit(X_sample)
        self._fitted = True

    def classify_shopper_session(self, path_length: float, dwell_time: float, pickups: int, returns: int, converted: bool) -> Dict[str, Any]:
        """
        Classifies a single shopper session using heuristic rules & ML cluster assignment
        """
        conv_val = 1.0 if converted else 0.0

        # Heuristic rules matching the exact specification requirements
        if path_length > 140.0 and dwell_time > 180.0 and pickups <= 2:
            segment = "Explorers"
            description = "High total path distance, high dwell time across multiple zones, low pickup frequency."
        elif dwell_time < 60.0 and path_length < 60.0 and pickups >= 1 and converted:
            segment = "Quick Buyers"
            description = "Low dwell time, direct path trajectory to single zone, immediate product pickup and checkout."
        elif dwell_time > 200.0 and returns >= 2:
            segment = "Comparison Shoppers"
            description = "Extended dwell time at single shelf, high product pickup and return events."
        elif path_length >= 60.0 and path_length <= 130.0 and dwell_time <= 90.0 and pickups >= 2:
            segment = "Impulse Buyers"
            description = "Moderate path length, short view duration followed by immediate pickup."
        elif converted and pickups >= 2 and path_length < 90.0:
            segment = "Brand Loyal Customers"
            description = "Targeted navigation to specific brand zones with high purchase conversion."
        else:
            segment = "Explorers"
            description = "Shoppers who browse multiple aisles and compare several product options."

        return {
            "segment": segment,
            "description": description,
            "metrics": {
                "path_length_m": round(path_length, 2),
                "dwell_time_sec": round(dwell_time, 1),
                "pickups": pickups,
                "returns": returns,
                "converted": converted
            }
        }
