from typing import Dict, Any, Tuple

def classify_shopper_session(feature_vector: Dict[str, Any]) -> Tuple[str, float]:
    """
    Classifies a shopper session based on feature snapshot:
    - path_distance: float
    - total_dwell: float
    - zone_count: int
    - max_shelf_dwell: float
    - pickups: int
    - returns: int
    - view_to_pickup_time: float
    - purchase_conversion: bool
    - brand_zone_targeted: bool
    """
    path_distance = feature_vector.get("path_distance", 0.0)
    total_dwell = feature_vector.get("total_dwell", 0.0)
    zone_count = feature_vector.get("zone_count", 1)
    max_shelf_dwell = feature_vector.get("max_shelf_dwell", 0.0)
    pickups = feature_vector.get("pickups", 0)
    returns = feature_vector.get("returns", 0)
    view_to_pickup_time = feature_vector.get("view_to_pickup_time", 10.0)
    purchased = feature_vector.get("purchase_conversion", False)
    brand_zone_targeted = feature_vector.get("brand_zone_targeted", False)

    pickup_rate = pickups / (total_dwell / 60.0) if total_dwell > 0 else 0.0

    # 1. Quick Buyers: Low dwell, direct route, quick pickup, high checkout conversion
    if total_dwell < 240 and path_distance < 80 and pickups >= 1 and purchased:
        return "Quick Buyers", 0.94

    # 2. Brand Loyal Customers: Targeted navigation to specific brand zone, immediate purchase
    if brand_zone_targeted and purchased and zone_count <= 2:
        return "Brand Loyal Customers", 0.92

    # 3. Comparison Shoppers: Extended shelf dwell, multiple pickups & returns
    if max_shelf_dwell > 90 or (pickups >= 2 and returns >= 1):
        return "Comparison Shoppers", 0.89

    # 4. Impulse Buyers: Moderate path, short view duration followed by immediate pickup
    if view_to_pickup_time < 5.0 and pickups >= 2:
        return "Impulse Buyers", 0.87

    # 5. Explorers: High path distance, high multi-zone dwell, low pickup frequency
    if path_distance > 100 or zone_count >= 3:
        return "Explorers", 0.91

    return "Explorers", 0.80
