import numpy as np

try:
  import cv2
except ImportError:
  cv2 = None

try:
  from scipy.stats import gaussian_kde
except ImportError:
  gaussian_kde = None

# Default Planogram Zone Reference Hotspots
HOTSPOT_LOCATIONS = {
  "bakery": {"x": 18, "y": 24, "heat": 45, "people": 7},
  "dairy": {"x": 36, "y": 24, "heat": 40, "people": 6},
  "beverages": {"x": 50, "y": 44, "heat": 96, "people": 18},
  "snacks": {"x": 68, "y": 24, "heat": 85, "people": 12},
  "household": {"x": 83, "y": 24, "heat": 60, "people": 7},
  "produce": {"x": 18, "y": 56, "heat": 65, "people": 9},
  "frozen": {"x": 50, "y": 64, "heat": 55, "people": 8},
  "personal": {"x": 79, "y": 56, "heat": 50, "people": 4},
  "entrance": {"x": 21, "y": 82, "heat": 80, "people": 14},
  "checkout": {"x": 49, "y": 84, "heat": 98, "people": 18},
  "exit": {"x": 78, "y": 82, "heat": 49, "people": 10},
}

class HeatmapEngine:
  def __init__(self):
    # Setup Homography Transformation Matrix between Camera Coordinates and Store Planogram Space
    # Camera Points (x,y) -> Store Planogram Points (X,Y)
    src_points = np.array([[50, 50], [1800, 50], [50, 1000], [1800, 1000]], dtype=np.float32)
    dst_points = np.array([[0, 0], [100, 0], [0, 100], [100, 100]], dtype=np.float32)
    
    if cv2 is not None:
      self.H, _ = cv2.findHomography(src_points, dst_points)
    else:
      self.H = np.eye(3)

  def transform_camera_coords(self, cam_x, cam_y):
    """
    Transforms camera pixel coordinates to store planogram normalized coordinates (0-100) using OpenCV homography matrix.
    """
    pts = np.array([[[cam_x, cam_y]]], dtype=np.float32)
    if cv2 is not None and self.H is not None:
      transformed = cv2.perspectiveTransform(pts, self.H)
      px, py = transformed[0][0]
      return float(np.clip(px, 0, 100)), float(np.clip(py, 0, 100))
    return float(cam_x % 100), float(cam_y % 100)

  def generate_kde_density_matrix(self, points, grid_size=(100, 100)):
    """
    Generates Kernel Density Estimation (KDE) density map using SciPy gaussian_kde.
    """
    if not points or len(points) < 3 or gaussian_kde is None:
      matrix = np.zeros(grid_size, dtype=np.float32)
      for p in points:
        x, y = int(np.clip(p[0], 0, grid_size[0]-1)), int(np.clip(p[1], 0, grid_size[1]-1))
        matrix[y, x] += 1.0
      return matrix

    x_coords = [p[0] for p in points]
    y_coords = [p[1] for p in points]

    kde = gaussian_kde(np.vstack([x_coords, y_coords]))
    xi, yi = np.mgrid[0:100:100j, 0:100:100j]
    zi = kde(np.vstack([xi.flatten(), yi.flatten()]))
    
    density_matrix = zi.reshape(grid_size)
    # Min-Max Normalize to [0, 100]
    norm_matrix = (density_matrix - density_matrix.min()) / (density_matrix.max() - density_matrix.min() + 1e-8) * 100.0
    return norm_matrix

  def get_heatmap_layer(self, layer_type="Store Traffic", period="Last 7 Days"):
    """
    Generates multi-layer heatmap structure (Store Traffic, Customer Attention, Product Gaze, Shelf Interaction, Zone Activity).
    """
    mult = 1.0
    if period == "Today":
      mult = 0.95
    elif period == "Yesterday":
      mult = 0.88
    elif period == "Last 30 Days":
      mult = 1.08

    layer_scale = 1.0
    if layer_type == "Customer Attention":
      layer_scale = 1.12
    elif layer_type == "Product Gaze":
      layer_scale = 0.90
    elif layer_type == "Shelf Interaction":
      layer_scale = 1.05
    elif layer_type == "Zone Activity":
      layer_scale = 0.98

    result_hotspots = {}
    for zone_id, info in HOTSPOT_LOCATIONS.items():
      val = min(99, round(info["heat"] * mult * layer_scale))
      ppl = round(info["people"] * mult)
      result_hotspots[zone_id] = {
        "x": info["x"],
        "y": info["y"],
        "heat": val,
        "people": ppl,
        "color_stop": "Red" if val > 80 else "Yellow" if val > 60 else "Green" if val > 40 else "Blue"
      }

    return {
      "layer": layer_type,
      "period": period,
      "hotspots": result_hotspots,
      "status": "Synchronized"
    }

heatmap_engine = HeatmapEngine()
