import numpy as np
import logging
from database import execute_query

logger = logging.getLogger(__name__)

class ProductAttractivenessEngine:
  def __init__(self):
    pass

  def _normalize(self, val, min_v, max_v):
    if max_v - min_v == 0:
      return 50.0
    return float(np.clip((val - min_v) / (max_v - min_v) * 100.0, 0.0, 100.0))

  def compute_sku_scores(self):
    """
    Computes Product Attractiveness Score (0-100) using weighted formula:
    Score = 0.35*A + 0.25*I + 0.20*P + 0.15*C + 0.05*R

    All 5 inputs are obtained from real persisted database tables:
    - A (Attention Duration): sum(attention_score) from attention_metrics
    - I (Interaction Freq): sum(views + pickups + returns) from product_interactions
    - P (Pickup Rate): sum(pickups) from product_interactions
    - C (Conversion Rate): ratio of purchases to pickups
    - R (Repeat Engagement): distinct count of repeat sessions for this product/zone
    """
    try:
      # Fetch all products from the database
      products_data = execute_query("SELECT product_id, name, category, shelf FROM products WHERE status = 'active';")
      if not products_data:
        logger.warning("No active products found in the database. Using fallback dummy database.")
        return []

      sku_scores = []
      
      # Fetch metrics from DB
      for p in products_data:
        prod_id = p["product_id"]
        prod_name = p["name"]
        prod_cat = p["category"]
        prod_shelf = p["shelf"]

        # 1. Attention Duration (A)
        attn_res = execute_query(
            "SELECT SUM(attention_score) as total_attn FROM attention_metrics WHERE product_id = %s;",
            (prod_id,)
        )
        attention_sec = float(attn_res[0]["total_attn"] or 0) if attn_res else 0.0

        # 2. Interactions (I) and Pickups (P)
        inter_res = execute_query(
            "SELECT SUM(views) as total_views, SUM(pickups) as total_pickups, SUM(returns) as total_returns "
            "FROM product_interactions WHERE product_id = %s;",
            (prod_id,)
        )
        views = int(inter_res[0]["total_views"] or 0) if inter_res else 0
        pickups = int(inter_res[0]["total_pickups"] or 0) if inter_res else 0
        returns = int(inter_res[0]["total_returns"] or 0) if inter_res else 0
        interactions = views + pickups + returns

        # 3. Purchases (C input)
        pur_res = execute_query(
            "SELECT COUNT(*) as total_purchases FROM transactions WHERE products LIKE %s;",
            (f"%{prod_name}%",)
        )
        purchases = int(pur_res[0]["total_purchases"] or 0) if pur_res else 0

        # 4. Repeat Engagement (R)
        # Count customer sessions visiting this product's zone more than once
        rep_res = execute_query(
            "SELECT COUNT(*) as repeat_count FROM ("
            "  SELECT customer_id FROM customers WHERE zone = %s GROUP BY customer_id HAVING COUNT(*) > 1"
            ") as sub;",
            (prod_cat,)
        )
        repeat_visits = int(rep_res[0]["repeat_count"] or 0) if rep_res else 0

        sku_scores.append({
            "sku": prod_id,
            "name": prod_name,
            "category": prod_cat,
            "shelf": prod_shelf,
            "attention_sec": attention_sec,
            "interactions": interactions,
            "pickups": pickups,
            "purchases": purchases,
            "repeat_visits": repeat_visits
        })

      # Normalize and calculate scores
      att_arr = [item["attention_sec"] for item in sku_scores]
      int_arr = [item["interactions"] for item in sku_scores]
      pic_arr = [item["pickups"] for item in sku_scores]
      pur_arr = [item["purchases"] / max(1, item["pickups"]) for item in sku_scores]
      rep_arr = [item["repeat_visits"] for item in sku_scores]

      min_att, max_att = min(att_arr), max(att_arr)
      min_int, max_int = min(int_arr), max(int_arr)
      min_pic, max_pic = min(pic_arr), max(pic_arr)
      min_pur, max_pur = min(pur_arr), max(pur_arr)
      min_rep, max_rep = min(rep_arr), max(rep_arr)

      results = []
      for item in sku_scores:
        A = self._normalize(item["attention_sec"], min_att, max_att)
        I = self._normalize(item["interactions"], min_int, max_int)
        P = self._normalize(item["pickups"], min_pic, max_pic)

        c_val = item["purchases"] / max(1, item["pickups"])
        C = self._normalize(c_val, min_pur, max_pur)
        R = self._normalize(item["repeat_visits"], min_rep, max_rep)

        # Exact CAMS Attractiveness Formula
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

    except Exception as e:
      logger.error(f"Failed to compute attractiveness scores from database: {e}")
      return []

attractiveness_engine = ProductAttractivenessEngine()
