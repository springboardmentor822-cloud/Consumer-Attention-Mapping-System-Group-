"""
One-off cleanup: remove Camera 3 and the Accessories shelf.

Why: Camera 3's source footage was fake (unrelated stock video), and with
only one real clothing video available, Usha approved dropping Camera 3
entirely and using Camera 2 as the sole camera for the Clothing shelf.
Accessories has no camera coverage at all now, so it's being removed too.

This deletes every dependent row FIRST (tracking events, shelf-camera
views, attractiveness scores, recommendations, shopper segments), THEN
the Shelf and Camera rows themselves — in that order, so nothing is
orphaned regardless of whether your DB enforces FK constraints.

Run it once, from the backend root:
    python -m app.services.cleanup_camera3_accessories

It prints counts and asks for confirmation before deleting anything.
Safe to delete this file after running it once.
"""

import sys
from sqlmodel import Session, select

from app.core.db import engine
from app.models.camera import Camera
from app.models.store import Shelf
from app.models.shelf_camera_view import ShelfCameraView
from app.models.product_attractiveness_score import ProductAttractivenessScore
from app.models.recommendation import Recommendation
from app.models.shopper_segment import ShopperSegment
from app.models.tracking_event import TrackingEvent


def run():
    with Session(engine) as session:
        camera3 = session.exec(
            select(Camera).where(Camera.name == "Camera 3")
        ).first()
        accessories = session.exec(
            select(Shelf).where(Shelf.shelf_name == "Accessories")
        ).first()

        if not camera3:
            print("No camera named 'Camera 3' found — check the name and edit this script if needed.")
            return
        if not accessories:
            print("No shelf named 'Accessories' found — check the name and edit this script if needed.")
            return

        camera3_id = camera3.id
        accessories_id = accessories.id

        tracking_events = session.exec(
            select(TrackingEvent).where(TrackingEvent.camera_id == str(camera3_id))
        ).all()
        shelf_camera_views = session.exec(
            select(ShelfCameraView).where(
                (ShelfCameraView.camera_id == camera3_id)
                | (ShelfCameraView.shelf_id == accessories_id)
            )
        ).all()
        attractiveness_scores = session.exec(
            select(ProductAttractivenessScore).where(
                (ProductAttractivenessScore.camera_id == camera3_id)
                | (ProductAttractivenessScore.shelf_id == accessories_id)
            )
        ).all()
        recommendations = session.exec(
            select(Recommendation).where(
                (Recommendation.camera_id == camera3_id)
                | (Recommendation.shelf_id == accessories_id)
            )
        ).all()
        shopper_segments = session.exec(
            select(ShopperSegment).where(ShopperSegment.camera_id == camera3_id)
        ).all()

        print("About to delete:")
        print(f"  TrackingEvent rows:              {len(tracking_events)}")
        print(f"  ShelfCameraView rows:             {len(shelf_camera_views)}")
        print(f"  ProductAttractivenessScore rows:  {len(attractiveness_scores)}")
        print(f"  Recommendation rows:              {len(recommendations)}")
        print(f"  ShopperSegment rows:               {len(shopper_segments)}")
        print(f"  Shelf row:                        Accessories ({accessories_id})")
        print(f"  Camera row:                       Camera 3 ({camera3_id})")

        confirm = input("Type 'yes' to proceed: ").strip().lower()
        if confirm != "yes":
            print("Aborted, nothing deleted.")
            return

        for row in tracking_events:
            session.delete(row)
        for row in shelf_camera_views:
            session.delete(row)
        for row in attractiveness_scores:
            session.delete(row)
        for row in recommendations:
            session.delete(row)
        for row in shopper_segments:
            session.delete(row)

        session.delete(accessories)
        session.delete(camera3)

        session.commit()
        print("Done. Camera 3 and Accessories shelf removed, along with all dependent rows.")


if __name__ == "__main__":
    sys.exit(run() or 0)
