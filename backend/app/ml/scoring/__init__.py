import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.schemas import Product, InteractionLog, TrackingLog

def update_product_attractiveness_score(db: Session, product_id: str) -> float:
    """
    Calculates and updates the Product Attractiveness Score based on the weighted model:
    - Attention Duration (35%)
    - Product Interaction Frequency (25%)
    - Product Pickup Rate (20%)
    - Purchase Conversion Rate (15%)
    - Repeat Engagement Rate (5%)
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        return 0.0

    today_start = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None).replace(hour=0, minute=0, second=0, microsecond=0)

    # 1. Attention Duration (35%)
    avg_dwell_query = db.query(func.avg(TrackingLog.dwell_time))\
        .filter(TrackingLog.gaze_facing_shelf_id != None, TrackingLog.timestamp >= today_start).scalar()
    avg_dwell = float(avg_dwell_query or 0.0)
    attention_duration_score = min(100.0, (avg_dwell / 60.0) * 100)

    # 2. Product Interaction Frequency (25%)
    total_interact = db.query(func.count(InteractionLog.id))\
        .filter(InteractionLog.product_id == product_id, InteractionLog.timestamp >= today_start).scalar() or 0
    total_shoppers = db.query(func.count(func.distinct(TrackingLog.shopper_id)))\
        .filter(TrackingLog.timestamp >= today_start).scalar() or 0
    
    interaction_freq_score = 0.0
    if total_shoppers > 0:
        interaction_freq_score = min(100.0, (total_interact / total_shoppers) * 100)

    # 3. Product Pickup Rate (20%)
    pickups = db.query(func.count(InteractionLog.id))\
        .filter(InteractionLog.product_id == product_id, InteractionLog.interaction_type == "pickup", InteractionLog.timestamp >= today_start).scalar() or 0
    views = db.query(func.count(InteractionLog.id))\
        .filter(InteractionLog.product_id == product_id, InteractionLog.interaction_type == "viewed", InteractionLog.timestamp >= today_start).scalar() or 0
    
    pickup_rate = 0.0
    total_views_and_picks = views + pickups
    if total_views_and_picks > 0:
        pickup_rate = (pickups / total_views_and_picks) * 100

    # 4. Purchase Conversion Rate (15%)
    purchases = db.query(func.count(InteractionLog.id))\
        .filter(InteractionLog.product_id == product_id, InteractionLog.interaction_type == "purchased", InteractionLog.timestamp >= today_start).scalar() or 0
    
    purchase_rate = 0.0
    if pickups > 0:
        purchase_rate = (purchases / pickups) * 100

    # 5. Repeat Engagement Rate (5%)
    from app.models.session import Session as ShopperSession
    interacted_shoppers_query = db.query(ShopperSession.shopper_identifier, func.count(InteractionLog.id))\
        .join(ShopperSession, InteractionLog.session_id == ShopperSession.id)\
        .filter(InteractionLog.product_id == product_id, InteractionLog.timestamp >= today_start)\
        .group_by(ShopperSession.shopper_identifier).all()
        
    repeat_shoppers = sum(1 for s in interacted_shoppers_query if s[1] > 1)
    total_interacted_shoppers = len(interacted_shoppers_query)
    
    repeat_rate = 0.0
    if total_interacted_shoppers > 0:
        repeat_rate = (repeat_shoppers / total_interacted_shoppers) * 100

    score = (
        (attention_duration_score * 0.35) +
        (interaction_freq_score * 0.25) +
        (pickup_rate * 0.20) +
        (purchase_rate * 0.15) +
        (repeat_rate * 0.05)
    )
    
    product.attractiveness_score = round(score, 1)
    db.commit()
    return product.attractiveness_score


def classify_consumer_segment(dwell_time: float, pickups: int, purchases: int, comparisons: int) -> str:
    if purchases > 0 and dwell_time < 30.0:
        return "Quick Buyer"
    elif comparisons > 2:
        return "Comparison Shopper"
    elif dwell_time > 120.0 and purchases == 0:
        return "Explorer"
    elif pickups > 0 and purchases > 0 and comparisons == 0:
        return "Brand Loyal Customer"
    else:
        return "Impulse Buyer"
