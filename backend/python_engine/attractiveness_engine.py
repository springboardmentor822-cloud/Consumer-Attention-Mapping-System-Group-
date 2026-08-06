import numpy as np

# Baseline SKU Metrics Dataset
SKU_DATABASE = [
  {"sku": "SKU-101", "name": "Artisan Sourdough Bread", "category": "Bakery", "shelf": "Shelf A3", "attention_sec": 42, "interactions": 185, "pickups": 115, "purchases": 92, "repeat_visits": 35},
  {"sku": "SKU-102", "name": "Organic Almond Milk 1L", "category": "Dairy", "shelf": "Shelf B2", "attention_sec": 38, "interactions": 140, "pickups": 88, "purchases": 74, "repeat_visits": 28},
  {"sku": "SKU-103", "name": "Sparkling Mineral Water 6pk", "category": "Beverages", "shelf": "Beverage Hub", "attention_sec": 65, "interactions": 290, "pickups": 210, "purchases": 180, "repeat_visits": 62},
  {"sku": "SKU-104", "name": "Gourmet Dark Chocolate 100g", "category": "Snacks", "shelf": "Snack Displays", "attention_sec": 52, "interactions": 220, "pickups": 145, "purchases": 110, "repeat_visits": 48},
  {"sku": "SKU-105", "name": "Premium Greek Yogurt 500g", "category": "Dairy", "shelf": "Shelf B2", "attention_sec": 34, "interactions": 125, "pickups": 80, "purchases": 68, "repeat_visits": 24},
  {"sku": "SKU-106", "name": "Free-Range Eggs 12pk", "category": "Dairy", "shelf": "Shelf B1", "attention_sec": 28, "interactions": 160, "pickups": 130, "purchases": 122, "repeat_visits": 40},
  {"sku": "SKU-107", "name": "Eco-Friendly Dish Soap", "category": "Household", "shelf": "Household Shelves", "attention_sec": 22, "interactions": 75, "pickups": 40, "purchases": 32, "repeat_visits": 12},
  {"sku": "SKU-108", "name": "Hydrating Face Serum 50ml", "category": "Personal Care", "shelf": "Personal Care", "attention_sec": 58, "interactions": 95, "pickups": 32, "purchases": 18, "repeat_visits": 15},
]

class ProductAttractivenessEngine:
  def __init__(self):
    pass

  def _normalize(self, val, min_v, max_v):
    if max_v - min_v == 0:
      return 50.0
    return float(np.clip((val - min_v) / (max_v - min_v) * 100.0, 0.0, 100.0))

  def compute_sku_scores(self, sku_list=None):
    """
    Computes Product Attractiveness Score (0-100) using weighted formula:
    Score = 0.35*A + 0.25*I + 0.20*P + 0.15*C + 0.05*R
    """
    data = sku_list if sku_list is not None else SKU_DATABASE

    att_arr = [item["attention_sec"] for item in data]
    int_arr = [item["interactions"] for item in data]
    pic_arr = [item["pickups"] for item in data]
    pur_arr = [item["purchases"] / max(1, item["pickups"]) for item in data]
    rep_arr = [item["repeat_visits"] for item in data]

    min_att, max_att = min(att_arr), max(att_arr)
    min_int, max_int = min(int_arr), max(int_arr)
    min_pic, max_pic = min(pic_arr), max(pic_arr)
    min_pur, max_pur = min(pur_arr), max(pur_arr)
    min_rep, max_rep = min(rep_arr), max(rep_arr)

    results = []
    for item in data:
      A = self._normalize(item["attention_sec"], min_att, max_att)
      I = self._normalize(item["interactions"], min_int, max_int)
      P = self._normalize(item["pickups"], min_pic, max_pic)

      c_val = item["purchases"] / max(1, item["pickups"])
      C = self._normalize(c_val, min_pur, max_pur)
      R = self._normalize(item["repeat_visits"], min_rep, max_rep)

      # Weighted Formula
      score = 0.35 * A + 0.25 * I + 0.20 * P + 0.15 * C + 0.05 * R
      score_rounded = round(float(score), 1)

      results.append({
        "sku": item["sku"],
        "name": item["name"],
        "category": item["category"],
        "shelf": item["shelf"],
        "score": score_rounded,
        "metrics": {
          "attention_duration_norm": round(A, 1),
          "interaction_freq_norm": round(I, 1),
          "pickup_rate_norm": round(P, 1),
          "conversion_rate_norm": round(C, 1),
          "repeat_engagement_norm": round(R, 1)
        }
      })

    # Sort descending by score
    results.sort(key=lambda x: x["score"], reverse=True)
    return results

attractiveness_engine = ProductAttractivenessEngine()
