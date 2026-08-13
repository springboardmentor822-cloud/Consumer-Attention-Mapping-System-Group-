import os
import sys
import time
import cv2
import json
import math

# Setup import path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.ml.detector import PersonDetector, ProductDetector
from app.ml.tracker import ByteTracker

INPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "datasets", "retail_videos"))
OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "datasets", "output_videos"))
os.makedirs(OUTPUT_DIR, exist_ok=True)

def map_filename(name: str) -> str:
    lower_name = name.lower()
    if "entrance" in lower_name:
        return "entrance_output.mp4"
    elif "exit" in lower_name:
        return "exit_output.mp4"
    elif "checkout" in lower_name:
        return "checkout_camera_output.mp4"
    elif "promotion" in lower_name:
        return "promotion_output.mp4"
    else:
        base = os.path.splitext(name)[0]
        return f"{base}_output.mp4"

def finalize_shopper_session(db, shopper_id: str, exit_time):
    from app.models.session import Session as ShopperSession
    from app.models.tracking import TrackingLog
    from app.models.interaction import ProductInteraction
    import math

    sess = db.query(ShopperSession).filter(
        ShopperSession.shopper_identifier == f"shopper_{shopper_id}"
    ).first()
    if not sess:
        return None

    logs = db.query(TrackingLog).filter(
        TrackingLog.shopper_id == shopper_id
    ).order_by(TrackingLog.timestamp.asc()).all()

    if not logs:
        return None

    entry_time = logs[0].timestamp
    sess.entry_time = entry_time
    sess.exit_time = exit_time
    duration = (exit_time - entry_time).total_seconds()
    sess.duration_seconds = max(1.0, duration)

    total_dist = 0.0
    stopping = 0
    prev_x, prev_y = None, None
    for log in logs:
        if prev_x is not None:
            dist = math.hypot(log.x - prev_x, log.y - prev_y)
            total_dist += dist
            if dist < 2.0:
                stopping += 1
        prev_x, prev_y = log.x, log.y

    sess.path_distance = total_dist
    sess.velocity = total_dist / sess.duration_seconds
    sess.stopping_events = stopping

    interactions = db.query(ProductInteraction).filter(
        ProductInteraction.session_id == sess.id
    ).all()
    
    sess.interaction_count = len(interactions)
    sess.shelf_visit_count = len(set(i.shelf_id for i in interactions if i.shelf_id))

    segment = "Explorer"
    if sess.duration_seconds < 40.0:
        if sess.interaction_count > 0:
            segment = "Quick Buyer"
        else:
            segment = "Impulse Buyer"
    else:
        if sess.shelf_visit_count == 1:
            segment = "Brand Loyal"
        elif sess.shelf_visit_count > 1:
            if sess.interaction_count > 2:
                segment = "Comparison Shopper"
            else:
                segment = "Explorer"

    sess.segment = segment
    db.commit()
    print(f"[ANALYTICS] Finalized Session shopper_{shopper_id} | Segment: {segment} | Distance: {total_dist:.1f} | Duration: {duration:.1f}s")
    return sess

class ProductTracker:
    def __init__(self):
        self.next_id = 1
        self.tracks = {} # id -> (bbox, last_seen, hits)

    def update(self, detected_products):
        updated_tracks = {}
        for p in detected_products:
            p_bbox = p["bbox"]
            px1, py1, px2, py2 = p_bbox
            pcx = (px1 + px2) / 2
            pcy = (py1 + py2) / 2
            
            # Find best match in existing tracks
            best_id = None
            best_dist = 50.0 # threshold distance for matching static products
            for tid, (tbox, _, _) in self.tracks.items():
                tcx = (tbox[0] + tbox[2]) / 2
                tcy = (tbox[1] + tbox[3]) / 2
                dist = math.hypot(pcx - tcx, pcy - tcy)
                if dist < best_dist:
                    best_dist = dist
                    best_id = tid
            
            if best_id is not None:
                tbox, last_seen, hits = self.tracks[best_id]
                new_hits = min(hits + 1, 100)
                updated_tracks[best_id] = (p_bbox, time.time(), new_hits)
                p["id"] = best_id
                p["hits"] = new_hits
            else:
                new_id = self.next_id
                self.next_id += 1
                updated_tracks[new_id] = (p_bbox, time.time(), 1)
                p["id"] = new_id
                p["hits"] = 1
                
        # Keep old tracks that were recently seen
        for tid, (tbox, last_seen, hits) in self.tracks.items():
            if tid not in updated_tracks and (time.time() - last_seen) < 1.5:
                updated_tracks[tid] = (tbox, last_seen, hits)
                
        self.tracks = updated_tracks
        return detected_products

def resolve_db_product(db, product_class: str):
    from app.models.product import Product as ProductModel
    from app.models.store import Store as StoreModel
    import uuid
    
    clean_name = product_class.strip().capitalize()
    if clean_name in ["Shelf product", "Shelf Product"]:
        clean_name = "Snack Item"
    elif clean_name in ["Product candidate", "Product Candidate"]:
        clean_name = "Promo Drink"
        
    prod = db.query(ProductModel).filter(ProductModel.name == clean_name).first()
    if not prod:
        store_obj = db.query(StoreModel).first()
        store_id = store_obj.id if store_obj else "store-1"
        prod = ProductModel(
            id=str(uuid.uuid4()),
            name=clean_name,
            sku=clean_name.upper()[:6] + "-SKU",
            category="General",
            price=2.99,
            store_id=store_id
        )
        db.add(prod)
        db.commit()
        db.refresh(prod)
    return prod

def resolve_db_shelf(db, shelf_name: str):
    from app.models.shelf import Shelf as ShelfModel
    from app.models.store import Store as StoreModel
    import uuid
    
    clean_name = shelf_name.strip()
    if clean_name == "None":
        clean_name = "Entrance Promo Display"
        
    sh = db.query(ShelfModel).filter(ShelfModel.name == clean_name).first()
    if not sh:
        store_obj = db.query(StoreModel).first()
        store_id = store_obj.id if store_obj else "store-1"
        sh = ShelfModel(
            id=str(uuid.uuid4()),
            name=clean_name,
            store_id=store_id,
            x=10, y=10, width=100, height=100
        )
        db.add(sh)
        db.commit()
        db.refresh(sh)
    return sh

def process_single_video(input_path: str, output_path: str):
    filename = os.path.basename(input_path)
    print(f"\nProcessing {filename} -> {os.path.basename(output_path)}")
    
    cap = cv2.VideoCapture(input_path)
    if not cap.isOpened():
        print(f"Error: Unable to open input video {input_path}")
        return
        
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps_in = cap.get(cv2.CAP_PROP_FPS) or 30.0
    
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    writer = cv2.VideoWriter(output_path, fourcc, fps_in, (width, height))
    
    # Initialize ML components
    from app.ml.interaction_engine import InteractionEngine
    from app.core.database import SessionLocal
    from app.models.schemas import Zone, Shelf
    
    db = SessionLocal()
    zones = [{"id": z.id, "name": z.name, "x": z.x, "y": z.y, "width": z.width, "height": z.height} for z in db.query(Zone).all()]
    shelves = [{"id": s.id, "name": s.name, "x": s.x, "y": s.y, "width": s.width, "height": s.height} for s in db.query(Shelf).all()]
    
    detector = PersonDetector()
    product_detector = ProductDetector()
    tracker = ByteTracker(track_thresh=0.3, match_thresh=0.8)
    interaction_engine = InteractionEngine()
    product_tracker = ProductTracker()
    
    # Track statistics
    known_tracks = set()
    lost_tracks = set()
    billing_tracks = {}
    trajectories = {}
    
    # Special analytics counters
    entrance_count = 0
    exit_count = 0
    billing_count = 0
    
    frame_idx = 0
    prev_time = time.time()
    
    is_entrance = "entrance" in filename.lower()
    is_exit = "exit" in filename.lower()
    is_checkout = "checkout" in filename.lower()
    is_aisle = "aisle" in filename.lower()
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
            
        frame_idx += 1
        curr_time = time.time()
        fps_proc = 1.0 / (curr_time - prev_time + 1e-6)
        prev_time = curr_time
        
        # 1. Customer detection and tracking
        detections = detector.detect(frame)
        tracks = tracker.update(detections)
        
        raw_products = product_detector.detect(frame)
        products = product_detector.nms(raw_products, iou_threshold=0.35, max_products=100)
        products = product_tracker.update(products)
        
        active_track_ids = set()
        for trk in tracks:
            bbox = trk["bbox"]
            track_id = str(trk["track_id"])
            active_track_ids.add(track_id)
            
            x1, y1, x2, y2 = map(int, bbox)
            cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
            
            # Lifecycle logs
            if track_id not in known_tracks:
                known_tracks.add(track_id)
                print(f"[EVENT] Customer Track Created: ID {track_id}")
                
                if is_entrance:
                    entrance_count += 1
                    print(f"[EVENT] Customer Entered: ID {track_id} | Total entries: {entrance_count}")
                    
                if is_exit:
                    exit_count += 1
                    print(f"[EVENT] Customer Exited: ID {track_id} | Total exits: {exit_count}")
            
            # Checkout billing validation
            if is_checkout:
                if 200 <= cx <= 500 and 150 <= cy <= 450:
                    if track_id not in billing_tracks:
                        billing_tracks[track_id] = time.time()
                        billing_count += 1
                        print(f"[EVENT] Billing Started: ID {track_id} | Billing customers count: {billing_count}")
                else:
                    if track_id in billing_tracks:
                        duration = time.time() - billing_tracks[track_id]
                        print(f"[EVENT] Billing Finished: ID {track_id} | Dwell Time: {duration:.2f}s")
                        del billing_tracks[track_id]
            
            # Run Advanced Interaction Engine
            # Coordinates are computed relative to actual input shape, but zones/shelves are defined relative to 640x480 scale
            # We resize coords to 640x480 inside interaction update
            scx = (cx / width) * 640.0
            scy = (cy / height) * 480.0
            s_bbox = [
                (bbox[0] / width) * 640.0,
                (bbox[1] / height) * 480.0,
                (bbox[2] / width) * 640.0,
                (bbox[3] / height) * 480.0
            ]
            
            # Convert products list coords to 640x480 scale
            scaled_prods = []
            for prod in products:
                p_bb = prod["bbox"]
                scaled_prods.append({
                    "class": prod["class"],
                    "confidence": prod["confidence"],
                    "bbox": [
                        (p_bb[0] / width) * 640.0,
                        (p_bb[1] / height) * 480.0,
                        (p_bb[2] / width) * 640.0,
                        (p_bb[3] / height) * 480.0
                    ]
                })

            eng_out = interaction_engine.update_shopper(
                track_id=track_id,
                cx=scx,
                cy=scy,
                bbox=s_bbox,
                shelves=shelves,
                products=scaled_prods,
                zones=zones,
                camera_id=filename
            )
            
            # Resolve or create the shopper session row in DB
            from app.models.session import Session as ShopperSession
            from app.models.store import Store as StoreModel
            from app.models.tracking import TrackingLog
            import datetime
            
            sess = db.query(ShopperSession).filter(
                ShopperSession.shopper_identifier == f"shopper_{track_id}"
            ).first()
            if not sess:
                store_obj = db.query(StoreModel).first()
                store_id = store_obj.id if store_obj else "store-1"
                sess = ShopperSession(
                    shopper_identifier=f"shopper_{track_id}",
                    store_id=store_id,
                    entry_time=datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
                )
                db.add(sess)
                db.commit()
                db.refresh(sess)
                
            # Log coordinate tracking
            db_log = TrackingLog(
                timestamp=datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None),
                shopper_id=track_id,
                camera_id=filename,
                zone_id=eng_out.get("zone_id", 1),
                x=cx,
                y=cy,
                gaze_facing_shelf_id=eng_out.get("shelf_name") if eng_out.get("shelf_name") != "None" else None,
                dwell_time=eng_out.get("dwell_time", 1.0)
            )
            db.add(db_log)
            db.commit()
            
            # Product Interaction Engine Logging
            nearest_prod_name = eng_out.get("nearest_product_name", "Shelf Product")
            shelf_name = eng_out.get("shelf_name", "Entrance Promo Display")
            
            db_prod = resolve_db_product(db, nearest_prod_name)
            db_shelf = resolve_db_shelf(db, shelf_name)
            
            db_interaction_type = None
            next_state = eng_out.get("state")
            if next_state == "VIEWING_SHELF":
                db_interaction_type = "view"
            elif next_state == "INTERACTING_WITH_PRODUCT":
                db_interaction_type = "compare"
            elif next_state == "PICKUP_CANDIDATE":
                db_interaction_type = "pickup"
            elif next_state == "RETURN_CANDIDATE":
                db_interaction_type = "return"
                
            if db_interaction_type:
                from app.models.interaction import ProductInteraction
                
                existing = db.query(ProductInteraction).filter(
                    ProductInteraction.session_id == sess.id,
                    ProductInteraction.product_id == db_prod.id,
                    ProductInteraction.interaction_type == db_interaction_type
                ).order_by(ProductInteraction.timestamp.desc()).first()
                
                if not existing or (datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None) - existing.timestamp).total_seconds() > 3.0:
                    int_log = ProductInteraction(
                        session_id=sess.id,
                        product_id=db_prod.id,
                        shelf_id=db_shelf.id,
                        interaction_type=db_interaction_type,
                        timestamp=datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
                    )
                    db.add(int_log)
                    db.commit()
            
            # Draw standard Customer BBoxes (BLUE boxes)
            cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 0, 0), 2)
            
            # Clean label overlay (Shopper ID and Dwell Time)
            label = f"Shopper #{track_id} | Dwell: {eng_out['dwell_time']:.1f}s"
            (w, h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.4, 1)
            cv2.rectangle(frame, (x1, y1 - 20), (x1 + w + 10, y1), (255, 0, 0), -1)
            cv2.putText(frame, label, (x1 + 5, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1, cv2.LINE_AA)
            
            # Interaction marker (Yellow text if interacting with product/shelf)
            if "INTERACT" in eng_out['state'] or "PICKUP" in eng_out['state'] or "RETURN" in eng_out['state']:
                cv2.circle(frame, (x1 + 10, y1 + 15), 5, (0, 255, 255), -1)
                cv2.putText(frame, "INTERACTING", (x1 + 20, y1 + 20), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (0, 255, 255), 1)
                
        # Draw products (Green boxes)
        rendered_prods = 0
        for prod in products:
            hits = prod.get("hits", 0)
            if hits < 5:
                continue
                
            p_bb = prod["bbox"]
            px1, py1, px2, py2 = map(int, p_bb)
            pid = prod.get("id", 1)
            
            # Green bounding box only
            cv2.rectangle(frame, (px1, py1), (px2, py2), (0, 255, 0), 1)
            cv2.putText(frame, f"Product #{pid}", (px1, py1 - 4), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (0, 255, 0), 1, cv2.LINE_AA)
            rendered_prods += 1
            
        print(f"[DEBUG] Frame {frame_idx}: Detected {len(raw_products)} raw products | Rendered {rendered_prods} products")
                
        # Track lost/exit event handling
        current_active_ids = {str(trk["track_id"]) for trk in tracks}
        for sh_id in list(interaction_engine.shoppers.keys()):
            if sh_id not in current_active_ids:
                exit_payload = interaction_engine.handle_exit(sh_id)
                if exit_payload:
                    sess = db.query(ShopperSession).filter(ShopperSession.shopper_identifier == f"shopper_{sh_id}").first()
                    if sess:
                        finalize_shopper_session(db, sh_id, datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None))
        
        writer.write(frame)
        
    cap.release()
    writer.release()
    db.close()
    print(f"Finished processing {filename}. Output saved to {output_path}")

def process_all():
    import shutil
    print(f"Scanning input folder: {INPUT_DIR}")
    for file in os.listdir(INPUT_DIR):
        if file.endswith(".mp4"):
            input_path = os.path.join(INPUT_DIR, file)
            out_filename = map_filename(file)
            output_path = os.path.join(OUTPUT_DIR, out_filename)
            process_single_video(input_path, output_path)
            if "aisle_camera_1" in file.lower():
                demo_path = os.path.join(OUTPUT_DIR, "interaction_demo.mp4")
                print(f"Copying {out_filename} to interaction_demo.mp4...")
                shutil.copy(output_path, demo_path)

if __name__ == "__main__":
    process_all()
