import numpy as np
import logging

logger = logging.getLogger("kalman_filter")

class ShopperKalmanFilter:
    def __init__(self, dt: float = 1.0, process_noise: float = 0.05, measurement_noise: float = 0.5):
        # State vector [x, y, vx, vy]^T
        self.x = np.zeros((4, 1))
        
        # State covariance matrix P
        self.P = np.eye(4) * 5.0
        
        # Transition matrix F
        self.F = np.array([
            [1.0, 0.0, dt,  0.0],
            [0.0, 1.0, 0.0, dt ],
            [0.0, 0.0, 1.0, 0.0],
            [0.0, 0.0, 0.0, 1.0]
        ])
        
        # Measurement matrix H (only observing x and y positions)
        self.H = np.array([
            [1.0, 0.0, 0.0, 0.0],
            [0.0, 1.0, 0.0, 0.0]
        ])
        
        # Process noise covariance matrix Q
        self.Q = np.array([
            [process_noise, 0.0, 0.0, 0.0],
            [0.0, process_noise, 0.0, 0.0],
            [0.0, 0.0, process_noise * 0.1, 0.0],
            [0.0, 0.0, 0.0, process_noise * 0.1]
        ])
        
        # Measurement noise covariance matrix R
        self.R = np.eye(2) * measurement_noise
        
        self.initialized = False

    def initialize(self, x: float, y: float):
        self.x = np.array([[x], [y], [0.0], [0.0]])
        self.P = np.eye(4) * 5.0
        self.initialized = True

    def predict(self):
        self.x = np.dot(self.F, self.x)
        self.P = np.dot(np.dot(self.F, self.P), self.F.T) + self.Q

    def update(self, z_x: float, z_y: float):
        z = np.array([[z_x], [z_y]])
        y = z - np.dot(self.H, self.x)  # Innovation
        S = np.dot(np.dot(self.H, self.P), self.H.T) + self.R
        K = np.dot(np.dot(self.P, self.H.T), np.linalg.inv(S))  # Kalman Gain
        
        self.x = self.x + np.dot(K, y)
        I = np.eye(4)
        self.P = np.dot(I - np.dot(K, self.H), self.P)

    def get_position(self) -> tuple:
        return float(self.x[0, 0]), float(self.x[1, 0])


class KalmanFilterManager:
    def __init__(self, dt: float = 1.0, process_noise: float = 0.05, measurement_noise: float = 0.5):
        self.filters = {}  # (camera_id, tracker_id) -> ShopperKalmanFilter
        self.dt = dt
        self.process_noise = process_noise
        self.measurement_noise = measurement_noise

    def get_smoothed_coords(self, camera_id: str, tracker_id: str, x: float, y: float) -> tuple:
        key = (camera_id, tracker_id)
        if key not in self.filters:
            self.filters[key] = ShopperKalmanFilter(
                dt=self.dt,
                process_noise=self.process_noise,
                measurement_noise=self.measurement_noise
            )
            self.filters[key].initialize(x, y)
            return x, y
        
        kf = self.filters[key]
        kf.predict()
        kf.update(x, y)
        
        smoothed_x, smoothed_y = kf.get_position()
        
        # Check for NaN/Inf coordinates and fallback to raw if they occur
        if np.isnan(smoothed_x) or np.isinf(smoothed_x) or np.isnan(smoothed_y) or np.isinf(smoothed_y):
            logger.warning(f"NaN/Inf generated in Kalman filter for {key}, resetting.")
            kf.initialize(x, y)
            return x, y
            
        return smoothed_x, smoothed_y

    def remove_filter(self, camera_id: str, tracker_id: str):
        key = (camera_id, tracker_id)
        if key in self.filters:
            del self.filters[key]

# Global filter manager instance
kalman_manager = KalmanFilterManager()
