import numpy as np
import logging
import datetime
from database import execute_query

try:
  import cv2
except ImportError:
  cv2 = None

try:
  from scipy.stats import gaussian_kde
except ImportError:
  gaussian_kde = None

logger = logging.getLogger(__name__)

# Default Planogram Zone Reference Hotspots (as fallback)
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

DB_ZONE_TO_HOTSPOT = {
  "bakery": "bakery", "ZN-01": "bakery", "Bakery": "bakery",
  "dairy": "dairy", "ZN-02": "dairy", "Dairy": "dairy",
  "beverages": "beverages", "Beverages": "beverages",
  "snacks": "snacks", "Snacks": "snacks",
  "produce": "produce", "ZN-03": "produce", "Produce": "produce",
  "cosmetics": "personal", "personal": "personal", "ZN-04": "personal", "Cosmetics": "personal", "Personal Care": "personal",
  "electronics": "electronics", "ZN-05": "electronics", "Electronics": "electronics",
  "household": "household", "ZN-06": "household", "Household": "household",
  "frozen": "frozen", "frozen foods": "frozen", "ZN-07": "frozen", "Frozen Foods": "frozen",
  "checkout": "checkout", "checkout area": "checkout", "ZN-08": "checkout", "Checkout": "checkout", "Checkout Area": "checkout",
  "entrance": "entrance", "store entrance": "entrance", "Entrance": "entrance",
  "exit": "exit", "exit lobby": "exit", "Exit": "exit", "Exit Lobby": "exit"
}

class HeatmapEngine:
  def __init__(self):
    # Homography Transformation Matrix Setup
    src_points = np.array([[50, 50], [1800, 50], [50, 1000], [1800, 1000]], dtype=np.float32)
    dst_points = np.array([[0, 0], [100, 0], [0, 100], [100, 100]], dtype=np.float32)
    
    if cv2 is not None:
      self.H, _ = cv2.findHomography(src_points, dst_points)
    else:
      self.H = np.eye(3)

  def transform_camera_coords(self, cam_x, cam_y):
    """
    Transforms camera pixel coordinates to store planogram normalized coordinates (0-100) using Homography.
    """
    pts = np.array([[[cam_x, cam_y]]], dtype=np.float32)
    if cv2 is not None and self.H is not None:
      transformed = cv2.perspectiveTransform(pts, self.H)
      px, py = transformed[0][0]
      return float(np.clip(px, 0, 100)), float(np.clip(py, 0, 100))
    return float(cam_x % 100), float(cam_y % 100)

  def generate_kde_density_matrix(self, points, grid_size=(100, 100)):
    """
    Generates Kernel Density Estimation (KDE) density map.
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
    norm_matrix = (density_matrix - density_matrix.min()) / (density_matrix.max() - density_matrix.min() + 1e-8) * 100.0
    return norm_matrix

  def get_heatmap_layer(self, layer_type="Store Traffic", period="Last 7 Days"):
    """
    Generates multi-layer heatmap using real tracking points from the database.
    """
    # Calculate start date for time period filtering
    now = datetime.datetime.now()
    if period == "Today":
      start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "Yesterday":
      start_date = now.replace(hour=0, minute=0, second=0, microsecond=0) - datetime.timedelta(days=1)
    elif period == "Last 30 Days":
      start_date = now - datetime.timedelta(days=30)
    else: # Default "Last 7 Days"
      start_date = now - datetime.timedelta(days=7)

    try:
      # Query coordinates from database
      points_data = execute_query(
          "SELECT zone_id, camera_id, x_coord, y_coord, intensity FROM heatmap_points WHERE timestamp >= %s;",
          (start_date,)
      )
    except Exception as e:
      logger.error(f"Error querying heatmap points: {e}")
      points_data = []

    # If database has no points, fallback to styled coordinates using base hotspots
    if not points_data or len(points_data) < 3:
      logger.info("Insufficient DB coordinates. Returning fallback planogram hotspots.")
      mult = 1.0
      if period == "Today": mult = 0.95
      elif period == "Yesterday": mult = 0.88
      elif period == "Last 30 Days": mult = 1.08

      layer_scale = 1.0
      if layer_type == "Customer Attention": layer_scale = 1.12
      elif layer_type == "Product Gaze": layer_scale = 0.90
      elif layer_type == "Shelf Interaction": layer_scale = 1.05
      elif layer_type == "Zone Activity": layer_scale = 0.98

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
        "status": "Fallback Mocks"
      }

    # Aggregate coordinates by zone key
    zone_groups = {}
    for pt in points_data:
      db_zone = pt["zone_id"]
      hotspot_key = DB_ZONE_TO_HOTSPOT.get(db_zone, "checkout")
      if hotspot_key not in zone_groups:
        zone_groups[hotspot_key] = []
      zone_groups[hotspot_key].append(pt)

    # Determine scale multiplier based on layer type
    layer_scale = 1.0
    if layer_type == "Customer Attention": layer_scale = 1.15
    elif layer_type == "Product Gaze": layer_scale = 0.95
    elif layer_type == "Shelf Interaction": layer_scale = 1.08

    result_hotspots = {}
    
    # Calculate density for each planogram zone from real database coordinates
    for key, defaults in HOTSPOT_LOCATIONS.items():
      pts = zone_groups.get(key, [])
      if not pts:
        # Fallback values for empty zones
        result_hotspots[key] = {
            "x": defaults["x"],
            "y": defaults["y"],
            "heat": 10,
            "people": 0,
            "color_stop": "Blue"
        }
        continue

      # Compute centroid x, y of actual tracked coordinates
      x_vals = [p["x_coord"] for p in pts]
      y_vals = [p["y_coord"] for p in pts]
      cx = round(float(np.mean(x_vals)))
      cy = round(float(np.mean(y_vals)))

      # Calculate density count
      density = len(pts)
      
      # Map count to 0-100 scale
      heat = min(99, round(math_scale_log(density) * layer_scale))
      people = max(1, round(density / 12.0))

      result_hotspots[key] = {
          "x": cx,
          "y": cy,
          "heat": heat,
          "people": people,
          "color_stop": "Red" if heat > 80 else "Yellow" if heat > 60 else "Green" if heat > 40 else "Blue"
      }

    return {
      "layer": layer_type,
      "period": period,
      "hotspots": result_hotspots,
      "status": "Synchronized"
    }

def math_scale_log(count):
  """Log scale mapping raw coordinate count to 0-100 density value"""
  if count <= 0:
    return 0
  # Log scaling so a few points show heat, but 200+ points hit max saturation
  return min(100.0, 15.0 + 18.0 * np.log(count + 1))

heatmap_engine = HeatmapEngine()
