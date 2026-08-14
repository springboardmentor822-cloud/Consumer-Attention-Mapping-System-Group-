import numpy as np
import cv2
from sklearn.cluster import KMeans
from filterpy.kalman import KalmanFilter
# ==========================================
# 1. SPATIAL MATH: HOMOGRAPHY MAPPING
# ==========================================
def get_homography_matrix():
    """
    Calculates the 3x3 transformation matrix to map camera pixels to the floor plan.
    Requires 4 reference points from the camera (src) and 4 corresponding points on the map (dst).
    """
    # Example calibration coordinates (Camera view vs Top-Down Map view)
    src_pts = np.float32([[100, 100], [500, 100], [100, 300], [500, 300]])
    dst_pts = np.float32([[0, 0], [100, 0], [0, 100], [100, 100]])
    
    # Calculate the perspective transformation matrix using RANSAC for robustness
    matrix, mask = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC, 5.0)
    return matrix

def map_to_floorplan(x, y, matrix):
    """Translates a bounding box bottom-center coordinate to a floor plan X,Y coordinate."""
    if matrix is None: return x, y
    point = np.float32([[[x, y]]])
    transformed = cv2.perspectiveTransform(point, matrix)
    return int(transformed[0][0][0]), int(transformed[0][0][1])

# ==========================================
# 2. MACHINE LEARNING: K-MEANS CLUSTERING
# ==========================================
def classify_shopper_behavior(shopper_data):
    """
    Groups shoppers into behavioral segments based on Dwell Time and Distance Walked.
    shopper_data format: [[dwell_time_seconds, path_distance_meters], ...]
    """
    if len(shopper_data) < 3:
        return ["Insufficient Data"] * len(shopper_data)

    # Initialize K-Means to find 3 distinct shopper segments
    kmeans = KMeans(n_clusters=3, init='k-means++', n_init=10, random_state=42)
    clusters = kmeans.fit_predict(shopper_data)
    
    # Map cluster IDs to human-readable behavioral segments
    segment_map = {0: "Grab & Go", 1: "Focused Buyers", 2: "Browsers / Explorers"}
    return [segment_map[c] for c in clusters]

# ==========================================
# 3. TRAJECTORY SMOOTHING: KALMAN FILTER
# ==========================================
def create_kalman_filter():
    """Initializes a Kalman Filter to predict and smooth YOLO bounding box trajectories."""
    kf = KalmanFilter(dim_x=4, dim_z=2)
    
    # State Transition Matrix
    kf.F = np.array([[1, 0, 1, 0],
                     [0, 1, 0, 1],
                     [0, 0, 1, 0],
                     [0, 0, 0, 1]])
    
    # Measurement Function
    kf.H = np.array([[1, 0, 0, 0],
                     [0, 1, 0, 0]])
    
    # Covariance Matrices
    kf.P *= 1000.  # Initial uncertainty
    kf.R = np.array([[5, 0], [0, 5]])  # Measurement noise
    kf.Q = np.eye(4) * 0.1             # Process noise
    
    return kf