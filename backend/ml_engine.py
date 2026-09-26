"""
ml_engine.py — spatial mapping, clustering, and trajectory-smoothing
utilities.

STATUS, PLAINLY: as of this writing, NOTHING in main.py calls any function
in this file. It's imported (defensively — see main.py's `import ml_engine`)
but otherwise fully disconnected from the live pipeline. Documented here so
this is a known, intentional gap rather than silently-dead code someone
finds by accident later:

1. get_homography_matrix() / map_to_floorplan() — REAL, correct
   perspective-transform code (cv2.findHomography + cv2.perspectiveTransform),
   but src_pts below are placeholder example coordinates, not a real
   calibration. Wiring this in for real requires physically measuring, for
   each of the 4 cameras, where 4 known floor-plan reference points
   actually appear in that camera's image — data that doesn't exist
   anywhere in this project and can't be fabricated here. Without it,
   main.py's get_heatmap_data() uses a linear approximation instead
   (bounding-box center scaled directly into the assigned zone's
   rectangle — see the FRAME_W/FRAME_H normalization there). That's a
   reasonable approximation for a roughly overhead or straight-on camera,
   but it will distort real positions for any camera mounted at a
   meaningful angle or with a wide field of view. If you get real
   calibration points for your camera setup, this is where they'd plug in.

2. classify_shopper_behavior() — a K-Means alternative to the rule-based
   classifier main.py actually uses (_classify_shopper_segment(), which
   also factors in real cross-camera Re-ID confirmation — see its
   docstring). This function was superseded, not integrated, and is kept
   here as reference/legacy rather than deleted outright.

3. create_kalman_filter() — a real, correctly-configured constant-velocity
   Kalman filter for smoothing YOLO bounding-box jitter frame-to-frame.
   Unlike #1, this needs NO external calibration data — it's a genuinely
   buildable improvement to dwell/pause timing precision. It wasn't wired
   into stream_camera_frames()'s per-frame tracking loop because that loop
   is a sensitive hot path multiple other features depend on directly
   (dwell time, pause detection, session-completion buffering, and the
   Re-ID/pose-detection cascade timing) — integrating it deserves its own
   focused pass with room to verify it doesn't shift that timing, not a
   drive-by addition alongside unrelated changes.
"""
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