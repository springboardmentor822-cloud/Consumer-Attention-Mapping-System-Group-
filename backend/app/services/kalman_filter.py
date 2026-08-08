import math
import numpy as np
from typing import List, Tuple, Dict, Any

class KalmanTrajectoryFilter:
    """
    2D Kalman Filter for smoothing camera coordinate trajectory jitter.
    State vector: [x, y, vx, vy]^T
    """
    def __init__(self, process_noise: float = 1e-2, measurement_noise: float = 1e-1):
        # Initial state: x, y, vx, vy
        self.x = np.zeros((4, 1))
        # State covariance
        self.P = np.eye(4) * 1.0
        # Transition matrix (dt = 1)
        self.F = np.array([
            [1, 0, 1, 0],
            [0, 1, 0, 1],
            [0, 0, 1, 0],
            [0, 0, 0, 1]
        ], dtype=float)
        # Measurement matrix (we observe x, y)
        self.H = np.array([
            [1, 0, 0, 0],
            [0, 1, 0, 0]
        ], dtype=float)
        # Process covariance Q
        self.Q = np.eye(4) * process_noise
        # Measurement covariance R
        self.R = np.eye(2) * measurement_noise

    def predict_and_update(self, z_x: float, z_y: float) -> Tuple[float, float]:
        """Ingests raw measurement (z_x, z_y) and returns smoothed (x, y)"""
        # Predict
        self.x = np.dot(self.F, self.x)
        self.P = np.dot(np.dot(self.F, self.P), self.F.T) + self.Q

        # Update
        z = np.array([[z_x], [z_y]])
        y_residual = z - np.dot(self.H, self.x)
        S = np.dot(np.dot(self.H, self.P), self.H.T) + self.R
        K = np.dot(np.dot(self.P, self.H.T), np.linalg.inv(S))
        
        self.x = self.x + np.dot(K, y_residual)
        self.P = np.dot((np.eye(4) - np.dot(K, self.H)), self.P)

        return float(self.x[0, 0]), float(self.x[1, 0])

    @staticmethod
    def smooth_trajectory(points: List[Tuple[float, float]]) -> List[Tuple[float, float]]:
        """Filters a sequence of 2D raw coordinate points"""
        if not points:
            return []
        kf = KalmanTrajectoryFilter()
        kf.x[0, 0] = points[0][0]
        kf.x[1, 0] = points[0][1]
        
        smoothed = []
        for (x, y) in points:
            sx, sy = kf.predict_and_update(x, y)
            smoothed.append((round(sx, 2), round(sy, 2)))
        return smoothed

    @staticmethod
    def calculate_journey_metrics(trajectory: List[Tuple[float, float]], dt: float = 1.0) -> Dict[str, Any]:
        """
        Calculates:
        - Total Path Distance: Euclidean sum between sequential coordinates
        - Mean Movement Velocity
        - Stop/Browse vs Passing Duration
        """
        if len(trajectory) < 2:
            return {"total_distance": 0.0, "mean_velocity": 0.0, "stop_ratio": 0.0}

        total_distance = 0.0
        velocities = []

        for i in range(len(trajectory) - 1):
            x1, y1 = trajectory[i]
            x2, y2 = trajectory[i+1]
            dist = math.sqrt((x2 - x1)**2 + (y2 - y1)**2)
            total_distance += dist
            velocities.append(dist / dt)

        mean_velocity = sum(velocities) / len(velocities) if velocities else 0.0
        stopped_count = sum(1 for v in velocities if v < 0.02)
        stop_ratio = stopped_count / len(velocities) if velocities else 0.0

        return {
            "total_distance": round(total_distance, 2),
            "mean_velocity": round(mean_velocity, 3),
            "stop_ratio": round(stop_ratio, 2)
        }
