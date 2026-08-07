import base64
import cv2
import numpy as np
from typing import List, Tuple, Dict, Any

try:
    from scipy.stats import gaussian_kde
    SCIPY_AVAILABLE = True
except ImportError:
    SCIPY_AVAILABLE = False


def compute_planogram_homography(
    src_camera_points: List[Tuple[float, float]],
    dst_planogram_points: List[Tuple[float, float]]
) -> np.ndarray:
    """
    Computes a 3x3 Homography Matrix using OpenCV (cv2.findHomography) to transform 
    2D camera pixel coordinates (x_c, y_c) into flat 2D store/planogram coordinates (x_p, y_p).
    """
    if len(src_camera_points) < 4 or len(dst_planogram_points) < 4:
        raise ValueError("At least 4 matching point pairs are required for homography calibration.")

    src_pts = np.float32(src_camera_points).reshape(-1, 1, 2)
    dst_pts = np.float32(dst_planogram_points).reshape(-1, 1, 2)

    H, status = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC, 5.0)
    return H


def transform_coordinates_homography(
    points: List[Tuple[float, float]],
    H_matrix: np.ndarray
) -> List[Tuple[float, float]]:
    """
    Transforms a list of camera coordinates into planogram layout coordinates using Homography matrix.
    """
    if not points or H_matrix is None:
        return points

    pts = np.float32(points).reshape(-1, 1, 2)
    transformed_pts = cv2.perspectiveTransform(pts, H_matrix)
    return [(float(p[0][0]), float(p[0][1])) for p in transformed_pts]


def generate_gaussian_kde_heatmap(
    points: List[Tuple[float, float]],
    grid_width: int = 100,
    grid_height: int = 100,
    bandwidth: float = 0.5
) -> np.ndarray:
    """
    Generates a Gaussian Kernel Density Estimation (KDE) density matrix over spatial interaction points.
    """
    if not points:
        return np.zeros((grid_height, grid_width), dtype=float)

    xs = [p[0] for p in points]
    ys = [p[1] for p in points]

    if SCIPY_AVAILABLE and len(points) > 3:
        try:
            # Rescale points to grid bounds if needed
            max_x = max(max(xs), 1.0)
            max_y = max(max(ys), 1.0)
            norm_xs = [x / max_x * grid_width for x in xs]
            norm_ys = [y / max_y * grid_height for y in ys]

            positions = np.vstack([norm_xs, norm_ys])
            kernel = gaussian_kde(positions, bw_method='scott')

            x_grid, y_grid = np.mgrid[0:grid_width, 0:grid_height]
            grid_coords = np.vstack([x_grid.ravel(), y_grid.ravel()])

            density = kernel(grid_coords).reshape((grid_width, grid_height)).T
            density_norm = (density - density.min()) / (density.max() - density.min() + 1e-8)
            return density_norm
        except Exception:
            pass

    # OpenCV / NumPy Fallback Gaussian Blur Heatmap
    heatmap = np.zeros((grid_height, grid_width), dtype=np.float32)
    max_x = max(max(xs), 1.0)
    max_y = max(max(ys), 1.0)

    for x, y in points:
        gx = int((x / max_x) * (grid_width - 1))
        gy = int((y / max_y) * (grid_height - 1))
        gx = max(0, min(grid_width - 1, gx))
        gy = max(0, min(grid_height - 1, gy))
        heatmap[gy, gx] += 1.0

    # Apply Gaussian Blur to smooth discrete interaction points
    blurred = cv2.GaussianBlur(heatmap, (15, 15), 0)
    if blurred.max() > 0:
        blurred = blurred / blurred.max()
    return blurred


def render_heatmap_layers(
    store_traffic_points: List[Tuple[float, float]],
    zone_activity_points: List[Tuple[float, float]],
    gaze_focus_points: List[Tuple[float, float]],
    shelf_hotspot_points: List[Tuple[float, float]],
    grid_size: Tuple[int, int] = (100, 100)
) -> Dict[str, Any]:
    """
    Renders 4 distinct spatial heatmap layers:
    1. Store traffic/movement paths
    2. Zone activity density
    3. Product gaze focus
    4. Grid-level shelf engagement hotspots
    """
    w, h = grid_size

    traffic_kde = generate_gaussian_kde_heatmap(store_traffic_points, w, h)
    zone_kde = generate_gaussian_kde_heatmap(zone_activity_points, w, h)
    gaze_kde = generate_gaussian_kde_heatmap(gaze_focus_points, w, h)
    shelf_kde = generate_gaussian_kde_heatmap(shelf_hotspot_points, w, h)

    return {
        "store_traffic_layer": traffic_kde.round(4).tolist(),
        "zone_activity_layer": zone_kde.round(4).tolist(),
        "product_gaze_layer": gaze_kde.round(4).tolist(),
        "shelf_hotspot_layer": shelf_kde.round(4).tolist(),
        "grid_dimensions": {"width": w, "height": h},
    }
