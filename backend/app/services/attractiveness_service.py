from typing import List, Dict, Any

class AttractivenessScoringEngine:
    """
    Computes Product Attractiveness Scores using Min-Max Scaling and the weighted formula:
    Attractiveness Score = 0.35*A + 0.25*I + 0.20*P + 0.15*C + 0.05*R
    Where:
    - A = Attention Duration
    - I = Interaction Frequency
    - P = Pickup Rate (Pickups / Views)
    - C = Purchase Conversion Rate (Purchases / Pickups)
    - R = Repeat Engagement Rate
    """
    @staticmethod
    def calculate_category_scores(raw_products: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        if not raw_products:
            return []

        # Min-Max normalization per metric across category
        attns = [p["raw_attention"] for p in raw_products]
        inters = [p["raw_interaction"] for p in raw_products]
        pickups = [p["raw_pickup_rate"] for p in raw_products]
        convs = [p["raw_conversion_rate"] for p in raw_products]
        repeats = [p["raw_repeat_rate"] for p in raw_products]

        def scale(val, min_v, max_v):
            if max_v == min_v:
                return 50.0
            return float(((val - min_v) / (max_v - min_v)) * 100.0)

        min_attn, max_attn = min(attns), max(attns)
        min_int, max_int = min(inters), max(inters)
        min_pic, max_pic = min(pickups), max(pickups)
        min_conv, max_conv = min(convs), max(convs)
        min_rep, max_rep = min(repeats), max(repeats)

        results = []
        for p in raw_products:
            norm_A = scale(p["raw_attention"], min_attn, max_attn)
            norm_I = scale(p["raw_interaction"], min_int, max_int)
            norm_P = scale(p["raw_pickup_rate"], min_pic, max_pic)
            norm_C = scale(p["raw_conversion_rate"], min_conv, max_conv)
            norm_R = scale(p["raw_repeat_rate"], min_rep, max_rep)

            final_score = (
                0.35 * norm_A +
                0.25 * norm_I +
                0.20 * norm_P +
                0.15 * norm_C +
                0.05 * norm_R
            )

            p_res = dict(p)
            p_res["norm_attention"] = round(norm_A, 1)
            p_res["norm_interaction"] = round(norm_I, 1)
            p_res["norm_pickup"] = round(norm_P, 1)
            p_res["norm_conversion"] = round(norm_C, 1)
            p_res["norm_repeat"] = round(norm_R, 1)
            p_res["attractiveness_score"] = round(final_score, 1)
            p_res["shelf_tier"] = p.get("shelf_tier", "Eye Level")
            results.append(p_res)

        results.sort(key=lambda x: x["attractiveness_score"], reverse=True)
        return results
