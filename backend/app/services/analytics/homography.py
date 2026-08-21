import cv2
import numpy as np
from typing import List, Tuple, Dict, Any
from scipy.stats import gaussian_kde

def compute_homography_matrix(src_points: List[List[float]], dst_points: List[List[float]]) -> List[List[float]]:
    """
    Computes 3x3 Homography matrix mapping camera coordinates to planogram coordinates.
    """
    src_pts = np.array(src_points, dtype=np.float32)
    dst_pts = np.array(dst_points, dtype=np.float32)
    
    H, mask = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC, 5.0)
    if H is None:
        H = np.eye(3, dtype=np.float32)
    return H.tolist()

def transform_camera_to_planogram(x_c: float, y_c: float, H_matrix: List[List[float]]) -> Tuple[float, float]:
    """
    Transforms camera coordinate (x_c, y_c) to planogram coordinate (x_p, y_p) via Homography matrix.
    """
    H = np.array(H_matrix, dtype=np.float32)
    pt = np.array([x_c, y_c, 1.0], dtype=np.float32).reshape(3, 1)
    dst_pt = np.dot(H, pt)
    if dst_pt[2, 0] != 0:
        xp = dst_pt[0, 0] / dst_pt[2, 0]
        yp = dst_pt[1, 0] / dst_pt[2, 0]
        return float(xp), float(yp)
    return x_c, y_c

def generate_gaussian_kde_heatmap(
    points: List[Tuple[float, float]], 
    width: int = 100, 
    height: int = 80,
    map_bounds: Tuple[float, float] = (1000.0, 800.0)
) -> Dict[str, Any]:
    """
    Generates an N x M normalized 2D Gaussian KDE matrix density heatmap from trajectory / interaction points.
    """
    if not points or len(points) < 3:
        # Fallback empty or default matrix
        matrix = [[0.0 for _ in range(width)] for _ in range(height)]
        return {
            "width": width,
            "height": height,
            "matrix": matrix,
            "legend_min": 0.0,
            "legend_max": 1.0
        }

    x_coords = np.array([p[0] for p in points])
    y_coords = np.array([p[1] for p in points])

    # Standardize grid search space
    grid_x, grid_y = np.mgrid[0:map_bounds[0]:complex(0, width), 0:map_bounds[1]:complex(0, height)]
    positions = np.vstack([grid_x.ravel(), grid_y.ravel()])

    values = np.vstack([x_coords, y_coords])
    
    try:
        kernel = gaussian_kde(values, bw_method='silverman')
        z = kernel(positions)
        z = z.reshape((width, height)).T # Transpose to get height x width
        
        # Min-max normalize 0 to 100
        z_min, z_max = z.min(), z.max()
        if z_max > z_min:
            z_norm = (z - z_min) / (z_max - z_min) * 100.0
        else:
            z_norm = z

        matrix = np.round(z_norm, 1).tolist()
    except Exception:
        matrix = [[0.0 for _ in range(width)] for _ in range(height)]

    return {
        "width": width,
        "height": height,
        "matrix": matrix,
        "legend_min": 0.0,
        "legend_max": 100.0
    }
