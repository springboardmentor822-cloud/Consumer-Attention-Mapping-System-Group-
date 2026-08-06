import math
import numpy as np

# Defined Store Zones with Planogram Coordinates
STORE_ZONES = [
  {"id": "entrance", "name": "Store Entrance", "bounds": (10, 70, 25, 85)},
  {"id": "bakery", "name": "Bakery", "bounds": (10, 10, 25, 35)},
  {"id": "dairy", "name": "Dairy", "bounds": (28, 10, 42, 35)},
  {"id": "beverages", "name": "Beverages", "bounds": (40, 30, 56, 50)},
  {"id": "snacks", "name": "Snacks", "bounds": (58, 10, 72, 35)},
  {"id": "household", "name": "Household", "bounds": (74, 10, 90, 35)},
  {"id": "produce", "name": "Produce", "bounds": (10, 40, 25, 65)},
  {"id": "frozen", "name": "Frozen Foods", "bounds": (40, 52, 56, 70)},
  {"id": "personal", "name": "Personal Care", "bounds": (70, 40, 88, 65)},
  {"id": "checkout", "name": "Checkout Area", "bounds": (38, 72, 62, 88)},
  {"id": "exit", "name": "Exit Lobby", "bounds": (68, 70, 88, 85)},
]

def resolve_zone_by_coords(x, y):
  for z in STORE_ZONES:
    x_min, y_min, x_max, y_max = z["bounds"]
    if x_min <= x <= x_max and y_min <= y <= y_max:
      return z["name"]
  if y > 70:
    return "Checkout Area"
  if x < 35:
    return "Produce"
  if x > 65:
    return "Personal Care"
  return "Central Aisle"

class ConsumerBehaviorEngine:
  def __init__(self):
    pass

  def calculate_trajectory(self, tracking_points):
    """
    Calculates total path distance using Euclidean Distance formula,
    movement velocity, per-zone dwell time, and full shopping journey path.
    """
    if not tracking_points or len(tracking_points) < 2:
      return {
        "total_distance": 0.0,
        "avg_speed": 0.0,
        "max_speed": 0.0,
        "min_speed": 0.0,
        "movement_state": "Standing",
        "zone_dwell_times": {},
        "journey": ["Entrance"],
        "revisited_zones": []
      }

    total_distance = 0.0
    speeds = []
    zone_dwell = {}
    journey = []
    visited_set = set()
    revisited = []

    for i in range(1, len(tracking_points)):
      p1 = tracking_points[i - 1]
      p2 = tracking_points[i]

      # Euclidean Distance formula
      dist = math.sqrt((p2['x'] - p1['x'])**2 + (p2['y'] - p1['y'])**2)
      total_distance += dist

      dt = max(0.1, p2.get('t', i) - p1.get('t', i - 1))
      speed = dist / dt
      speeds.append(speed)

      zone = resolve_zone_by_coords(p2['x'], p2['y'])
      zone_dwell[zone] = zone_dwell.get(zone, 0) + dt

      if not journey or journey[-1] != zone:
        if zone in visited_set and zone not in revisited:
          revisited.append(zone)
        visited_set.add(zone)
        journey.append(zone)

    avg_speed = float(np.mean(speeds)) if speeds else 0.0
    max_speed = float(np.max(speeds)) if speeds else 0.0
    min_speed = float(np.min(speeds)) if speeds else 0.0

    # Movement State Classification
    if avg_speed < 0.5:
      movement_state = "Standing"
    elif avg_speed < 1.2:
      movement_state = "Browsing"
    elif avg_speed < 2.5:
      movement_state = "Walking"
    else:
      movement_state = "Passing Through"

    return {
      "total_distance": round(total_distance, 2),
      "avg_speed": round(avg_speed, 2),
      "max_speed": round(max_speed, 2),
      "min_speed": round(min_speed, 2),
      "movement_state": movement_state,
      "zone_dwell_times": {k: round(v, 1) for k, v in zone_dwell.items()},
      "journey": journey,
      "revisited_zones": revisited
    }

  def classify_shopper_segment(self, trajectory_data, pickups=0, returns=0, comparisons=0):
    """
    Classifies shopper into 1 of 5 behavioral segments:
    - Explorer
    - Quick Buyer
    - Comparison Shopper
    - Impulse Buyer
    - Brand Loyal Customer
    """
    total_dist = trajectory_data.get("total_distance", 0)
    journey = trajectory_data.get("journey", [])
    total_dwell = sum(trajectory_data.get("zone_dwell_times", {}).values())

    if comparisons >= 2 or (pickups >= 2 and returns >= 1):
      return {
        "segment": "Comparison Shopper",
        "description": "High dwell time, multiple product pickups & comparisons",
        "confidence": 0.94
      }
    elif total_dist > 120 and len(journey) >= 5:
      return {
        "segment": "Explorer",
        "description": "Long path distance, visits many zones, extended browsing",
        "confidence": 0.91
      }
    elif total_dist < 45 and total_dwell < 60:
      return {
        "segment": "Quick Buyer",
        "description": "Direct path, low dwell time, immediate checkout",
        "confidence": 0.96
      }
    elif pickups >= 1 and total_dwell < 90:
      return {
        "segment": "Impulse Buyer",
        "description": "Moderate walking, short viewing time, immediate pickup",
        "confidence": 0.88
      }
    else:
      return {
        "segment": "Brand Loyal Customer",
        "description": "Direct navigation to preferred shelves, high purchase conversion",
        "confidence": 0.92
      }

behavior_engine = ConsumerBehaviorEngine()
