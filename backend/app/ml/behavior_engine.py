import math
import numpy as np
from typing import List, Dict, Tuple, Any

try:
    from sklearn.cluster import KMeans
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False


class SimpleKalmanFilter2D:
    """
    Kalman Filter for 2D Coordinate Smoothing (Position & Velocity)
    """
    def __init__(self, process_noise=0.1, measurement_noise=1.0):
        self.x = np.zeros((4, 1))  # [x, y, vx, vy]
        self.P = np.eye(4) * 1000.0  # State covariance
        self.F = np.array([
            [1, 0, 1, 0],
            [0, 1, 0, 1],
            [0, 0, 1, 0],
            [0, 0, 0, 1]
        ], dtype=float)
        self.H = np.array([
            [1, 0, 0, 0],
            [0, 1, 0, 0]
        ], dtype=float)
        self.Q = np.eye(4) * process_noise
        self.R = np.eye(2) * measurement_noise
        self.initialized = False

    def update(self, z_x: float, z_y: float) -> Tuple[float, float]:
        z = np.array([[z_x], [z_y]])
        if not self.initialized:
            self.x[0, 0] = z_x
            self.x[1, 0] = z_y
            self.initialized = True
            return z_x, z_y

        # Predict step
        self.x = np.dot(self.F, self.x)
        self.P = np.dot(np.dot(self.F, self.P), self.F.T) + self.Q

        # Update step
        y = z - np.dot(self.H, self.x)
        S = np.dot(np.dot(self.H, self.P), self.H.T) + self.R
        K = np.dot(np.dot(self.P, self.H.T), np.linalg.inv(S))
        self.x = self.x + np.dot(K, y)
        self.P = np.dot((np.eye(4) - np.dot(K, self.H)), self.P)

        return float(self.x[0, 0]), float(self.x[1, 0])


def smooth_trajectory(points: List[Tuple[float, float]]) -> List[Tuple[float, float]]:
    """
    Applies Kalman Filter smoothing over raw (x, y) continuous trajectory points.
    """
    if not points:
        return []
    kf = SimpleKalmanFilter2D()
    smoothed = []
    for px, py in points:
        sx, sy = kf.update(px, py)
        smoothed.append((round(sx, 2), round(sy, 2)))
    return smoothed


def calculate_trajectory_metrics(
    raw_points: List[Tuple[float, float]],
    timestamps: List[float],
    zone_polygons: Dict[str, List[Tuple[float, float]]] = None
) -> Dict[str, Any]:
    """
    Calculates journey metrics: Total Path Distance, Zone Dwell Times, Movement Velocity.
    """
    smoothed_points = smooth_trajectory(raw_points)
    total_distance = 0.0
    velocities = []

    for i in range(1, len(smoothed_points)):
        p1 = smoothed_points[i - 1]
        p2 = smoothed_points[i]
        dist = math.sqrt((p2[0] - p1[0]) ** 2 + (p2[1] - p1[1]) ** 2)
        total_distance += dist

        if timestamps and i < len(timestamps):
            dt = timestamps[i] - timestamps[i - 1]
            if dt > 0:
                velocities.append(dist / dt)

    avg_velocity = float(np.mean(velocities)) if velocities else 0.0
    total_dwell_seconds = timestamps[-1] - timestamps[0] if timestamps and len(timestamps) > 1 else len(raw_points) * 0.5

    # Calculate Zone Dwell Times if polygon bounding zones provided
    zone_dwells = {}
    if zone_polygons:
        for zone_name, poly in zone_polygons.items():
            dwell_count = sum(1 for p in smoothed_points if point_in_polygon(p, poly))
            zone_dwells[zone_name] = dwell_count * 0.5  # 0.5s per frame estimate

    return {
        "total_path_distance": round(total_distance, 2),
        "avg_movement_velocity": round(avg_velocity, 2),
        "total_dwell_seconds": round(total_dwell_seconds, 2),
        "zone_dwell_times": zone_dwells,
        "smoothed_points": smoothed_points,
    }


def point_in_polygon(point: Tuple[float, float], polygon: List[Tuple[float, float]]) -> bool:
    """Ray-casting algorithm to test if point is inside a polygon."""
    x, y = point
    n = len(polygon)
    inside = False
    p1x, p1y = polygon[0]
    for i in range(n + 1):
        p2x, p2y = polygon[i % n]
        if y > min(p1y, p2y):
            if y <= max(p1y, p2y):
                if x <= max(p1x, p2x):
                    if p1y != p2y:
                        xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or x <= xinters:
                        inside = not inside
        p1x, p1y = p2x, p2y
    return inside


def classify_shopper_segment(
    total_path_distance: float,
    total_dwell_seconds: float,
    pickup_count: int,
    purchase_count: int,
    distinct_zones_visited: int = 1
) -> str:
    """
    Classifies a session into 1 of 5 buyer personas:
    - Explorers: High path distance, high dwell across multiple zones, low pickup frequency.
    - Quick Buyers: Low dwell time, direct path to single zone, immediate product pickup & checkout.
    - Comparison Shoppers: Extended dwell time at single shelf, high product pickup and return events.
    - Impulse Buyers: Moderate path length, short view duration followed by immediate pickup.
    - Brand Loyal Customers: Targeted navigation to specific brand zones with high purchase conversion.
    """
    if purchase_count >= 1 and distinct_zones_visited == 1 and total_dwell_seconds < 120:
        return "brand_loyal"
    elif total_dwell_seconds < 90 and pickup_count >= 1 and purchase_count >= 1:
        return "quick_buyers"
    elif pickup_count >= 3 and purchase_count == 0:
        return "comparison_shoppers"
    elif total_path_distance > 150.0 and total_dwell_seconds > 200.0 and distinct_zones_visited >= 3:
        return "explorers"
    elif pickup_count >= 1 and total_dwell_seconds < 150.0:
        return "impulse_buyers"
    elif total_path_distance > 100.0:
        return "explorers"
    else:
        return "quick_buyers"

