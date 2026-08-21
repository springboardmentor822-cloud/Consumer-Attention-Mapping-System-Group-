from typing import List, Dict, Any

def compute_product_attractiveness_scores(
    product_metrics_list: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Computes category-normalized Product Attractiveness Scores using exact blueprint formula:
    Score = 0.35*A + 0.25*I + 0.20*P + 0.15*C + 0.05*R
    """
    if not product_metrics_list:
        return []

    # Group by category for relative intra-category min-max normalization
    categories: Dict[str, List[Dict[str, Any]]] = {}
    for p in product_metrics_list:
        cat = p.get("category", "General")
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(p)

    scored_results = []

    for cat, items in categories.items():
        # Extract category min/max
        a_vals = [item["raw_metrics"]["A"] for item in items]
        i_vals = [item["raw_metrics"]["I"] for item in items]
        p_vals = [item["raw_metrics"]["P"] for item in items]
        c_vals = [item["raw_metrics"]["C"] for item in items]
        r_vals = [item["raw_metrics"]["R"] for item in items]

        def normalize(val: float, val_list: List[float]) -> float:
            min_v, max_v = min(val_list), max(val_list)
            if max_v == min_v:
                return 50.0
            return ((val - min_v) / (max_v - min_v)) * 100.0

        for item in items:
            raw = item["raw_metrics"]
            a_norm = normalize(raw["A"], a_vals)
            i_norm = normalize(raw["I"], i_vals)
            p_norm = normalize(raw["P"], p_vals)
            c_norm = normalize(raw["C"], c_vals)
            r_norm = normalize(raw["R"], r_vals)

            final_score = (
                0.35 * a_norm +
                0.25 * i_norm +
                0.20 * p_norm +
                0.15 * c_norm +
                0.05 * r_norm
            )

            scored_results.append({
                "product_id": item["product_id"],
                "sku": item["sku"],
                "name": item["name"],
                "category": cat,
                "shelf_id": item.get("shelf_id"),
                "shelf_level": item.get("shelf_level", "EYE_LEVEL"),
                "raw_metrics": raw,
                "normalized_metrics": {
                    "A": round(a_norm, 1),
                    "I": round(i_norm, 1),
                    "P": round(p_norm, 1),
                    "C": round(c_norm, 1),
                    "R": round(r_norm, 1)
                },
                "final_score": round(final_score, 1)
            })

    return scored_results
