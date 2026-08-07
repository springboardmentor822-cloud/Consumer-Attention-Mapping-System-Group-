from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models import OptimizationRecommendation, ProductAttractivenessScore


def evaluate_diagnostic_rules(
    attractiveness_scores: List[Dict[str, Any]],
    shelf_traffic_metrics: Dict[str, float] = None
) -> List[Dict[str, Any]]:
    """
    Applies heuristic decision tree diagnostic checks over SKU scores and placement coordinates:
    1. High Attention + Low Pickup -> Price/packaging check alert.
    2. High Pickup + Low Purchase Conversion -> Product quality/label inspection alert.
    3. Cold Shelf Zones -> Relocate popular anchor product to cold zone.
    4. Top Performer on Bottom Shelf -> Eye-Level relocation recommendation.
    """
    recommendations = []

    for item in attractiveness_scores:
        sku = item.get("product_sku", "SKU")
        name = item.get("product_name", "Product")
        score = item.get("attractiveness_score", 0.0)
        norm_att = item.get("normalized_attention", 0.0)
        norm_pick = item.get("normalized_pickup", 0.0)
        norm_conv = item.get("normalized_conversion", 0.0)
        shelf = item.get("shelf_location", "Shelf A")

        # Rule 1: High Attention + Low Pickup
        if norm_att >= 70.0 and norm_pick <= 30.0:
            recommendations.append({
                "target_sku": sku,
                "product_name": name,
                "priority_level": "high",
                "rule_type": "high_attention_low_pickup",
                "action_item": f"Review pricing/packaging for '{name}'. Grabs high gaze attention ({norm_att:.1f}%), but shoppers decline to pick it up.",
                "expected_conversion_uplift": "+18.5%",
            })

        # Rule 2: High Pickup + Low Purchase Conversion
        if norm_pick >= 60.0 and norm_conv <= 25.0:
            recommendations.append({
                "target_sku": sku,
                "product_name": name,
                "priority_level": "high",
                "rule_type": "high_pickup_low_conversion",
                "action_item": f"Inspect product quality/label info for '{name}'. High pickup rate ({norm_pick:.1f}%), but high return/abandonment before checkout.",
                "expected_conversion_uplift": "+22.0%",
            })

        # Rule 3: Top-performing score on bottom shelf (Eye-Level Relocation)
        if score >= 75.0 and ("Bottom" in shelf or "Shelf E" in shelf or "Shelf D" in shelf):
            recommendations.append({
                "target_sku": sku,
                "product_name": name,
                "priority_level": "high",
                "rule_type": "eye_level_relocation",
                "action_item": f"Relocate high-performing item '{name}' (Score: {score:.1f}) from {shelf} to Eye-Level Slot (Shelf A/B) to maximize gaze conversion.",
                "expected_conversion_uplift": "+25.4%",
            })

    # Rule 4: Cold Shelf Zones Check
    if shelf_traffic_metrics:
        for shelf_name, traffic_val in shelf_traffic_metrics.items():
            if traffic_val < 30.0:
                recommendations.append({
                    "target_sku": "ANCHOR-SKU",
                    "product_name": f"Anchor Products for {shelf_name}",
                    "priority_level": "medium",
                    "rule_type": "cold_shelf_zone",
                    "action_item": f"Cold zone detected at {shelf_name} (Traffic density: {traffic_val:.1f}%). Place high-demand anchor products to boost aisle flow.",
                    "expected_conversion_uplift": "+12.0%",
                })

    return recommendations


def generate_and_save_recommendations(
    db: Session,
    store_id: int,
    sku_attractiveness_list: List[Dict[str, Any]]
) -> List[OptimizationRecommendation]:
    """
    Generates recommendations and saves them to optimization_recommendations table.
    """
    evaluated = evaluate_diagnostic_rules(sku_attractiveness_list)
    saved_records = []

    for rec in evaluated:
        record = OptimizationRecommendation(
            store_id=store_id,
            target_sku=rec["target_sku"],
            product_name=rec["product_name"],
            priority_level=rec["priority_level"],
            rule_type=rec["rule_type"],
            action_item=rec["action_item"],
            expected_conversion_uplift=rec["expected_conversion_uplift"],
            status="active",
        )
        db.add(record)
        saved_records.append(record)

    db.commit()
    for r in saved_records:
        db.refresh(r)

    return saved_records
