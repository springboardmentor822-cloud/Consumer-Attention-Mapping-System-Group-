from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models import ProductAttractivenessScore


def calculate_product_attractiveness_score(
    attention_duration_seconds: float,
    interaction_count: int,
    pickup_rate: float,
    purchase_conversion_rate: float,
    repeat_engagement_rate: float,
    category_benchmarks: Dict[str, float] = None
) -> Dict[str, float]:
    """
    Calculates weighted Product Attractiveness Score based on:
    Score = (0.35 * A) + (0.25 * I) + (0.20 * P) + (0.15 * C) + (0.05 * R)

    Raw features are Min-Max normalized to scale [0, 100].
    """
    benchmarks = category_benchmarks or {
        "max_attention": 60.0,
        "max_interaction": 20.0,
        "max_pickup": 1.0,
        "max_conversion": 1.0,
        "max_repeat": 1.0,
    }

    norm_A = min(100.0, max(0.0, (attention_duration_seconds / benchmarks["max_attention"]) * 100.0))
    norm_I = min(100.0, max(0.0, (interaction_count / benchmarks["max_interaction"]) * 100.0))
    norm_P = min(100.0, max(0.0, (pickup_rate / benchmarks["max_pickup"]) * 100.0))
    norm_C = min(100.0, max(0.0, (purchase_conversion_rate / benchmarks["max_conversion"]) * 100.0))
    norm_R = min(100.0, max(0.0, (repeat_engagement_rate / benchmarks["max_repeat"]) * 100.0))

    final_score = (
        (0.35 * norm_A) +
        (0.25 * norm_I) +
        (0.20 * norm_P) +
        (0.15 * norm_C) +
        (0.05 * norm_R)
    )

    return {
        "normalized_attention": round(norm_A, 2),
        "normalized_interaction": round(norm_I, 2),
        "normalized_pickup": round(norm_P, 2),
        "normalized_conversion": round(norm_C, 2),
        "normalized_repeat": round(norm_R, 2),
        "attractiveness_score": round(final_score, 2),
    }


def compute_and_save_sku_attractiveness(
    db: Session,
    store_id: int,
    sku_data: Dict[str, Any]
) -> ProductAttractivenessScore:
    """
    Computes weighted score and persists record into product_attractiveness_scores table.
    """
    scores = calculate_product_attractiveness_score(
        attention_duration_seconds=sku_data.get("attention_duration_seconds", 0.0),
        interaction_count=sku_data.get("interaction_count", 0),
        pickup_rate=sku_data.get("pickup_rate", 0.0),
        purchase_conversion_rate=sku_data.get("purchase_conversion_rate", 0.0),
        repeat_engagement_rate=sku_data.get("repeat_engagement_rate", 0.0),
    )

    record = ProductAttractivenessScore(
        store_id=store_id,
        product_sku=sku_data.get("product_sku", "SKU-UNKNOWN"),
        product_name=sku_data.get("product_name", "Unnamed Product"),
        category=sku_data.get("category", "General"),
        shelf_location=sku_data.get("shelf_location", "Shelf A"),
        attention_duration_seconds=sku_data.get("attention_duration_seconds", 0.0),
        interaction_count=sku_data.get("interaction_count", 0),
        pickup_rate=sku_data.get("pickup_rate", 0.0),
        purchase_conversion_rate=sku_data.get("purchase_conversion_rate", 0.0),
        repeat_engagement_rate=sku_data.get("repeat_engagement_rate", 0.0),
        normalized_attention=scores["normalized_attention"],
        normalized_interaction=scores["normalized_interaction"],
        normalized_pickup=scores["normalized_pickup"],
        normalized_conversion=scores["normalized_conversion"],
        normalized_repeat=scores["normalized_repeat"],
        attractiveness_score=scores["attractiveness_score"],
    )

    db.add(record)
    db.commit()
    db.refresh(record)
    return record
