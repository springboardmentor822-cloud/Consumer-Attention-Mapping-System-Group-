import math
from typing import List, Dict, Tuple, Optional, Any
import numpy as np

class KalmanFilter2D:
    """
    2D Constant Velocity Kalman Filter for smoothing tracking jitter.
    State vector: [x, y, vx, vy]
    """
    def __init__(self, process_noise: float = 1e-2, measurement_noise: float = 1e-1):
        self.dt = 1.0
        # State: [x, y, vx, vy]
        self.x = np.zeros((4, 1))
        
        # State transition matrix
        self.F = np.array([
            [1, 0, self.dt, 0],
            [0, 1, 0, self.dt],
            [0, 0, 1, 0],
            [0, 0, 0, 1]
        ])
        
        # Measurement matrix (we only measure x, y)
        self.H = np.array([
            [1, 0, 0, 0],
            [0, 1, 0, 0]
        ])
        
        # Covariance matrices
        self.P = np.eye(4) * 100.0
        self.Q = np.eye(4) * process_noise
        self.R = np.eye(2) * measurement_noise

    def initialize(self, x0: float, y0: float):
        self.x = np.array([[x0], [y0], [0.0], [0.0]])

    def predict_and_update(self, z_x: float, z_y: float) -> Tuple[float, float, float]:
        # Predict
        self.x = np.dot(self.F, self.x)
        self.P = np.dot(np.dot(self.F, self.P), self.F.T) + self.Q
        
        # Measurement update
        z = np.array([[z_x], [z_y]])
        y = z - np.dot(self.H, self.x)
        S = np.dot(np.dot(self.H, self.P), self.H.T) + self.R
        K = np.dot(np.dot(self.P, self.H.T), np.linalg.inv(S))
        
        self.x = self.x + np.dot(K, y)
        self.P = np.dot((np.eye(4) - np.dot(K, self.H)), self.P)
        
        smoothed_x = float(self.x[0, 0])
        smoothed_y = float(self.x[1, 0])
        vx = float(self.x[2, 0])
        vy = float(self.x[3, 0])
        speed = math.sqrt(vx**2 + vy**2)
        
        return smoothed_x, smoothed_y, speed

def point_in_polygon(x: float, y: float, polygon: List[List[float]]) -> bool:
    """Ray-casting algorithm to test if point (x, y) is inside polygon coordinates."""
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

def process_raw_trajectory(
    raw_points: List[Dict[str, float]], 
    zones: List[Dict[str, Any]]
) -> Tuple[List[Dict[str, Any]], float, float, Dict[str, float]]:
    """
    Applies Kalman smoothing, removes impossible jumps, calculates path distance,
    instantaneous velocity, and zone dwell durations.
    """
    if not raw_points:
        return [], 0.0, 0.0, {}

    kf = KalmanFilter2D()
    kf.initialize(raw_points[0]["x"], raw_points[0]["y"])

    processed_points = []
    total_distance = 0.0
    zone_dwells: Dict[str, float] = {}

    prev_x, prev_y = None, None

    for idx, pt in enumerate(raw_points):
        rx, ry = pt["x"], pt["y"]

        # Jump filter: ignore points moving > 300 units in a single step (impossible teleports)
        if prev_x is not None and prev_y is not None:
            step_dist = math.sqrt((rx - prev_x)**2 + (ry - prev_y)**2)
            if step_dist > 300.0:
                continue

        sx, sy, vel = kf.predict_and_update(rx, ry)

        # Distance calculation
        if prev_x is not None and prev_y is not None:
            d = math.sqrt((sx - prev_x)**2 + (sy - prev_y)**2)
            total_distance += d

        # Zone intersection check
        detected_zone = None
        for z in zones:
            if point_in_polygon(sx, sy, z["polygon_coords"]):
                detected_zone = z["id"]
                zone_dwells[z["id"]] = zone_dwells.get(z["id"], 0.0) + 1.0 # 1 sec step assumption
                break

        processed_points.append({
            "x": rx,
            "y": ry,
            "smoothed_x": round(sx, 2),
            "smoothed_y": round(sy, 2),
            "velocity": round(vel, 2),
            "zone_id": detected_zone,
            "timestamp": pt.get("timestamp")
        })

        prev_x, prev_y = sx, sy

    total_dwell = len(processed_points) * 1.0 # seconds
    return processed_points, round(total_distance, 2), round(total_dwell, 2), zone_dwells
