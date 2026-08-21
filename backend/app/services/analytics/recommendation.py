import uuid
from typing import List, Dict, Any

def generate_merchandising_recommendations(
    scored_products: List[Dict[str, Any]],
    shelf_dwell_stats: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Evaluates retail rules to produce actionable merchandising recommendations:
    - High attention + low pickup -> Packaging / pricing check
    - High pickup + low purchase conversion -> Quality / pricing inspection
    - Cold shelf/zone -> Place a high-performing anchor product
    - High-attractiveness product on bottom shelf -> Move toward eye level
    """
    recommendations = []

    for prod in scored_products:
        sku = prod["sku"]
        shelf_id = prod.get("shelf_id", "SHELF-01")
        shelf_level = prod.get("shelf_level", "EYE_LEVEL")
        norm = prod["normalized_metrics"]
        score = prod["final_score"]

        # Rule 1: High attention + low pickup -> Packaging/pricing check
        if norm["A"] >= 70.0 and norm["P"] < 40.0:
            recommendations.append({
                "id": f"REC-{uuid.uuid4().hex[:6].upper()}",
                "priority": "HIGH",
                "store_id": prod.get("store_id", "STORE-812"),
                "sku": sku,
                "shelf_id": shelf_id,
                "action": "Packaging / pricing check",
                "reason": "High shopper attention duration (score: {:.1f}) but low pickup conversion (score: {:.1f})".format(norm["A"], norm["P"]),
                "expected_conversion_uplift": 14.5
            })

        # Rule 2: High pickup + low purchase conversion -> Quality/pricing inspection
        if norm["P"] >= 65.0 and norm["C"] < 35.0:
            recommendations.append({
                "id": f"REC-{uuid.uuid4().hex[:6].upper()}",
                "priority": "HIGH",
                "store_id": prod.get("store_id", "STORE-812"),
                "sku": sku,
                "shelf_id": shelf_id,
                "action": "Quality / pricing inspection",
                "reason": "High shelf pickup rate (score: {:.1f}) but low checkout conversion (score: {:.1f})".format(norm["P"], norm["C"]),
                "expected_conversion_uplift": 18.2
            })

        # Rule 4: High-attractiveness product on bottom shelf -> Move toward eye level
        if score >= 75.0 and shelf_level == "BOTTOM":
            recommendations.append({
                "id": f"REC-{uuid.uuid4().hex[:6].upper()}",
                "priority": "HIGH",
                "store_id": prod.get("store_id", "STORE-812"),
                "sku": sku,
                "shelf_id": shelf_id,
                "action": "Move product toward eye-level",
                "reason": "High product attractiveness (Score: {:.1f}) restricted by bottom-shelf placement".format(score),
                "expected_conversion_uplift": 22.4
            })

    # Rule 3: Cold shelf/zone check
    for shelf in shelf_dwell_stats:
        if shelf.get("total_dwell", 0.0) < 60.0: # Cold shelf
            recommendations.append({
                "id": f"REC-{uuid.uuid4().hex[:6].upper()}",
                "priority": "MEDIUM",
                "store_id": shelf.get("store_id", "STORE-812"),
                "sku": "ZONE-ANCHOR",
                "shelf_id": shelf.get("shelf_id", "SHELF-COLD"),
                "action": "Place a high-performing anchor product",
                "reason": f"Underperforming shelf traffic (total dwell {shelf.get('total_dwell', 0)}s below threshold)",
                "expected_conversion_uplift": 11.0
            })

    return recommendations
