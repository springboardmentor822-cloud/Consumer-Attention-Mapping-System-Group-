import time
import math
import json
import datetime

class InteractionEngine:
    def __init__(self):
        # Maps track_id -> shopper history details
        self.shoppers = {}

    def update_shopper(self, track_id: str, cx: float, cy: float, bbox: list, shelves: list, products: list, zones: list, camera_id: str) -> dict:
        now = time.time()
        now_str = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None).isoformat()
        
        # 1. Initialize shopper tracking structure
        if track_id not in self.shoppers:
            self.shoppers[track_id] = {
                "entry_time": now,
                "last_seen": now,
                "state": "IDLE",
                "state_start_time": now,
                "last_state": "IDLE",
                "overlap_start_time": None,
                "had_overlap": False,
                "current_product_id": None
            }
            
        sh = self.shoppers[track_id]
        sh["last_seen"] = now
        total_dwell = now - sh["entry_time"]
        state_duration = now - sh["state_start_time"]
        
        # 2. Find Nearest Shelf
        nearest_shelf = None
        min_shelf_dist = 99999.0
        for s in shelves:
            scx = float(s["x"]) + float(s["width"]) / 2.0
            scy = float(s["y"]) + float(s["height"]) / 2.0
            dist = math.hypot(cx - scx, cy - scy)
            if dist < min_shelf_dist:
                min_shelf_dist = dist
                nearest_shelf = s
                
        # 3. Find Nearest Zone
        active_zone_id = 1
        active_zone_name = "Entrance Foyer"
        nx = (cx / 640.0) * 100.0
        ny = (cy / 480.0) * 100.0
        for z in zones:
            if z["x"] <= nx <= z["x"] + z["width"] and z["y"] <= ny <= z["y"] + z["height"]:
                active_zone_name = z["name"]
                if "entrance" in z["name"].lower() or "entrance" in z["id"].lower():
                    active_zone_id = 1
                elif "aisle" in z["name"].lower() or "aisle" in z["id"].lower():
                    active_zone_id = 2
                elif "checkout" in z["name"].lower() or "checkout" in z["id"].lower():
                    active_zone_id = 3
                break

        # 4. Find Nearest Product
        nearest_product = None
        min_prod_dist = 99999.0
        for p in products:
            p_bbox = p["bbox"]
            pcx = (p_bbox[0] + p_bbox[2]) / 2.0
            pcy = (p_bbox[1] + p_bbox[3]) / 2.0
            dist = math.hypot(cx - pcx, cy - pcy)
            if dist < min_prod_dist:
                min_prod_dist = dist
                nearest_product = p
                
        # 5. State Machine Computations
        next_state = "IDLE"
        if nearest_shelf and min_shelf_dist < 150.0:
            next_state = "APPROACHING_SHELF"
            
            # Viewing check: remains near nearest product (>3s)
            if nearest_product and min_prod_dist < 80.0:
                next_state = "VIEWING_SHELF"
                
                # Check for overlap
                px1, py1, px2, py2 = map(int, nearest_product["bbox"])
                x1, y1, x2, y2 = map(int, bbox)
                overlap_x = max(0, min(x2, px2) - max(x1, px1))
                overlap_y = max(0, min(y2, py2) - max(y1, py1))
                has_overlap = (overlap_x * overlap_y) > 0
                
                if has_overlap:
                    next_state = "INTERACTING_WITH_PRODUCT"
                    if not sh["had_overlap"]:
                        sh["overlap_start_time"] = now
                        sh["had_overlap"] = True
                    
                    # Persisted overlap triggers pickup
                    if sh["overlap_start_time"] and (now - sh["overlap_start_time"]) > 3.0:
                        next_state = "PICKUP_CANDIDATE"
                else:
                    # If overlap just disappeared
                    if sh["had_overlap"]:
                        next_state = "RETURN_CANDIDATE"
                        sh["had_overlap"] = False
                        sh["overlap_start_time"] = None
        else:
            if sh["state"] not in ["IDLE", "LEAVING_SHELF"]:
                next_state = "LEAVING_SHELF"
                
        # Update state timers
        if next_state != sh["state"]:
            print(f"[STATE] Shopper #{track_id} Transition: {sh['state']} -> {next_state}")
            sh["state"] = next_state
            sh["state_start_time"] = now
            state_duration = 0.0
            
            # Print structured CAMS events
            print(f"[EVENT] Shopper {track_id} entered state {next_state} | Zone: {active_zone_name} | Shelf: {nearest_shelf['name'] if nearest_shelf else 'None'} | Dwell: {total_dwell:.1f}s")
            
        # 6. Push Structured Event JSON
        event_payload = {
            "shopper_id": track_id,
            "shelf_id": nearest_shelf["name"] if nearest_shelf else "None",
            "zone_id": active_zone_id,
            "nearest_product": nearest_product["class"] if nearest_product else "None",
            "interaction_state": next_state,
            "interaction_type": "viewed" if next_state == "VIEWING_SHELF" else ("pickup" if "pickup" in next_state.lower() else "returned"),
            "dwell_time": float(total_dwell),
            "timestamp": now_str,
            "camera_id": camera_id
        }
        
        return {
            "state": next_state,
            "shelf_name": nearest_shelf["name"] if nearest_shelf else "None",
            "zone_id": active_zone_id,
            "zone_name": active_zone_name,
            "nearest_product_name": nearest_product["class"] if nearest_product else "None",
            "dwell_time": total_dwell,
            "payload": event_payload
        }
        
    def handle_exit(self, track_id: str) -> dict:
        if track_id in self.shoppers:
            sh = self.shoppers[track_id]
            total_dwell = time.time() - sh["entry_time"]
            now_str = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None).isoformat()
            camera_id = sh.get("camera_id", "unknown-camera")
            del self.shoppers[track_id]
            print(f"[STATE] Shopper #{track_id} Transition ➔ EXIT")
            return {
                "shopper_id": track_id,
                "shelf_id": "None",
                "zone_id": 1,
                "nearest_product": "None",
                "interaction_state": "EXIT",
                "interaction_type": "EXIT",
                "dwell_time": float(total_dwell),
                "timestamp": now_str,
                "camera_id": camera_id
            }
        return None
