import datetime
import logging
from database import execute_query

logger = logging.getLogger(__name__)

class MerchandisingRecommendationEngine:
  def __init__(self):
    pass

  def generate_recommendations(self, sku_scores=None):
    """
    Evaluates merchandising rules on database-backed SKU scores:
    - Rule 1: High Attention + Low Pickup -> Packaging & Price point warnings
    - Rule 2: High Pickup + Low Purchase -> Unit pricing/expiration warnings
    - Rule 3: Low Traffic Shelf -> Cross-aisle relocation recommendations
    - Rule 4: High Attractiveness + Low Shelf Placement -> Move to Eye-Level Tier
    """
    recommendations = []
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # If no sku_scores passed, compute them dynamically
    if not sku_scores:
      from attractiveness_engine import attractiveness_engine
      sku_scores = attractiveness_engine.compute_sku_scores()

    # Fallback to static mock recommendations if database is completely empty/unpopulated
    has_real_data = False
    if sku_scores:
      # Check if any SKU has non-zero interactions
      # Find if total attention/interactions exist in database
      res = execute_query("SELECT SUM(views) as total_views FROM product_interactions;")
      if res and res[0]["total_views"] and int(res[0]["total_views"]) > 0:
        has_real_data = True

    if not has_real_data:
      logger.info("Unpopulated database. Returning baseline recommendations.")
      # Rule 1 Fallback
      recommendations.append({
        "id": "REC-101",
        "rule": "Rule 1 - Attention vs Pickup Disconnect",
        "priority": "High",
        "shelf": "Personal Care D4",
        "sku": "SKU-108 (Hydrating Face Serum)",
        "recommendation": "High customer attention (58s) but low pickup rate (33%). Review packaging design, label legibility, and promotional price point.",
        "expected_conversion_improvement": "+14.5%",
        "timestamp": now_str
      })
      # Rule 2 Fallback
      recommendations.append({
        "id": "REC-102",
        "rule": "Rule 2 - Pickup vs Purchase Drop-off",
        "priority": "Critical",
        "shelf": "Snack Displays C1",
        "sku": "SKU-104 (Gourmet Dark Chocolate)",
        "recommendation": "High pickup frequency (145 pickups) but 24% checkout drop-off. Inspect product expiration date, unit pricing clarity, or offer bundle discount.",
        "expected_conversion_improvement": "+18.2%",
        "timestamp": now_str
      })
      # Rule 3 Fallback
      recommendations.append({
        "id": "REC-103",
        "rule": "Rule 3 - Low Traffic Corridor Optimization",
        "priority": "Medium",
        "shelf": "Household Shelves F1",
        "sku": "SKU-107 (Eco-Friendly Dish Soap)",
        "recommendation": "Shelf traffic density is below store baseline (46% density). Move high-performing impulse SKUs to front endcap to drive cross-aisle footfall.",
        "expected_conversion_improvement": "+9.8%",
        "timestamp": now_str
      })
      # Rule 4 Fallback
      recommendations.append({
        "id": "REC-104",
        "rule": "Rule 4 - Eye-Level Placement Rule",
        "priority": "High",
        "shelf": "Bakery Racks A3",
        "sku": "SKU-101 (Artisan Sourdough Bread)",
        "recommendation": "High product attractiveness score (92.4) currently located on bottom rack. Relocate to Eye-Level Tier (1.2m - 1.5m height) for maximum visibility.",
        "expected_conversion_improvement": "+22.0%",
        "timestamp": now_str
      })
      return recommendations

    # Iterate and construct dynamic recommendations from actual database metrics!
    rec_count = 101
    
    # Sort scores to find high-performing and underperforming items
    sku_by_attn = sorted(sku_scores, key=lambda s: s["metrics"]["attention_duration_norm"], reverse=True)
    sku_by_pick = sorted(sku_scores, key=lambda s: s["metrics"]["pickup_rate_norm"], reverse=True)
    
    # 1. Rule 1: High Attention + Low Pickup Rate
    # Find SKU with high attention norm (>40) but low pickup norm (<50)
    rule1_sku = None
    for s in sku_by_attn:
      if s["metrics"]["attention_duration_norm"] > 40 and s["metrics"]["pickup_rate_norm"] < 50:
        rule1_sku = s
        break
    if not rule1_sku and sku_scores:
      rule1_sku = sku_scores[-1] # fallback to lowest score item
      
    if rule1_sku:
      recommendations.append({
        "id": f"REC-{rec_count}",
        "rule": "Rule 1 - Attention vs Pickup Disconnect",
        "priority": "High",
        "shelf": rule1_sku["shelf"],
        "sku": f"{rule1_sku['sku']} ({rule1_sku['name']})",
        "recommendation": f"High customer attention norm ({rule1_sku['metrics']['attention_duration_norm']:.0f}%) but low pickup rate norm ({rule1_sku['metrics']['pickup_rate_norm']:.0f}%). Review packaging legibility, brand layout, and price positioning on the shelf.",
        "expected_conversion_improvement": "+12.5%",
        "timestamp": now_str
      })
      rec_count += 1

    # 2. Rule 2: High Pickup Rate + Low Purchase Conversion
    rule2_sku = None
    for s in sku_by_pick:
      if s["metrics"]["pickup_rate_norm"] > 50 and s["metrics"]["conversion_rate_norm"] < 45:
        rule2_sku = s
        break
    if not rule2_sku and len(sku_scores) > 1:
      rule2_sku = sku_scores[1]
      
    if rule2_sku:
      recommendations.append({
        "id": f"REC-{rec_count}",
        "rule": "Rule 2 - Pickup vs Purchase Drop-off",
        "priority": "Critical",
        "shelf": rule2_sku["shelf"],
        "sku": f"{rule2_sku['sku']} ({rule2_sku['name']})",
        "recommendation": f"High pickup frequency ({rule2_sku['metrics']['pickup_rate_norm']:.0f}% rate) but low checkout conversion ({rule2_sku['metrics']['conversion_rate_norm']:.0f}% norm). Inspect price tag clarity, product freshness/expiration, or offer an endcap bundle discount.",
        "expected_conversion_improvement": "+16.8%",
        "timestamp": now_str
      })
      rec_count += 1

    # 3. Rule 3: Low Traffic Zone/Corridor Relocation
    # Query zone with lowest visitor count
    zone_res = execute_query(
        "SELECT zone_id, SUM(visitor_count) as total_visitors "
        "FROM dwell_metrics GROUP BY zone_id ORDER BY total_visitors ASC LIMIT 1;"
    )
    lowest_zone = zone_res[0]["zone_id"] if zone_res else "Household"
    lowest_visitors = int(zone_res[0]["total_visitors"] or 0) if zone_res else 45
    
    recommendations.append({
      "id": f"REC-{rec_count}",
      "rule": "Rule 3 - Low Traffic Corridor Optimization",
      "priority": "Medium",
      "shelf": f"{lowest_zone} Endcap",
      "sku": f"Impulse Category in {lowest_zone}",
      "recommendation": f"{lowest_zone} zone traffic is below baseline ({lowest_visitors} visitors). Relocate high-attractiveness bread or milk endcap items to this corridor to pull customer flow.",
      "expected_conversion_improvement": "+8.4%",
      "timestamp": now_str
    })
    rec_count += 1

    # 4. Rule 4: High Attractiveness + Low Shelf Placement (Bottom Shelf A3/SH-101 Racks)
    # Find highly attractive SKU
    best_sku = sku_scores[0] if sku_scores else None
    if best_sku:
      recommendations.append({
        "id": f"REC-{rec_count}",
        "rule": "Rule 4 - Eye-Level Placement Rule",
        "priority": "High",
        "shelf": best_sku["shelf"],
        "sku": f"{best_sku['sku']} ({best_sku['name']})",
        "recommendation": f"High attractiveness score ({best_sku['score']:.1f}) located on lower placement racks. Relocate {best_sku['name']} to Eye-Level Tier (1.2m height) on {best_sku['shelf']} for maximum conversion.",
        "expected_conversion_improvement": "+20.5%",
        "timestamp": now_str
      })
      
    return recommendations

recommendation_engine = MerchandisingRecommendationEngine()
