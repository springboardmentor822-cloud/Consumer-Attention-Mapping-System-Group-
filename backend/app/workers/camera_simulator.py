import time
import random
import logging
import threading
from typing import List, Dict, Any
from app.core.redis_client import redis_client

logger = logging.getLogger("camera_simulator")

class CameraSimulator:
    def __init__(self):
        self.running = False
        self.thread = None
        self.interval = 0.5  # Simulate every 0.5s (2 FPS)
        
        # State of shoppers across the 4 cameras
        # shopper_id -> { 'camera_id': int, 'x': float, 'y': float, 'dwell_time': int, 'gaze_target': str, 'gaze_x': float, 'gaze_y': float, 'active': bool }
        self.shoppers: Dict[int, Dict[str, Any]] = {}
        self.next_shopper_id = 101

    def start(self):
        if self.running:
            return
        self.running = True
        self.thread = threading.Thread(target=self._run_loop, daemon=True)
        self.thread.start()
        logger.info("Camera simulation engine started.")

    def stop(self):
        self.running = False
        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=1.0)
        logger.info("Camera simulation engine stopped.")

    def _run_loop(self):
        while self.running:
            try:
                self._simulate_camera_1()  # Entrance/Foyer (cctv_1.mp4)
                self._simulate_camera_2()  # Main Aisle A (cctv_2.mp4)
                self._simulate_camera_3()  # Main Aisle B (cctv_3.mp4)
                self._simulate_camera_4()  # Checkout Lanes 1 (cctv_4.mp4)
                self._simulate_camera_5()  # Section 5 (cctv_5.mp4)
                self._simulate_camera_6()  # Promotion Area (cctv_6.mp4)
                self._simulate_camera_7()  # Checkout Lanes 2 (cctv_7.mp4)
                self._simulate_camera_8()  # Store Exit (cctv_8.mp4)
                
                time.sleep(self.interval)
            except Exception as e:
                logger.error(f"Simulator error: {e}")
                time.sleep(1.0)

    def _push_event(self, camera_id: int, shopper_id: int, x: float, y: float, dwell: int, gaze_target: str, gaze_x: float, gaze_y: float, object_type: str = "person", confidence: float = 0.96, label: str = "Person"):
        event = {
            "camera_id": str(camera_id),
            "shopper_id": str(shopper_id),
            "x": str(round(x, 2)),
            "y": str(round(y, 2)),
            "dwell_time": str(dwell),
            "gaze_target": gaze_target or "",
            "gaze_x": str(round(gaze_x, 2)) if gaze_x is not None else "",
            "gaze_y": str(round(gaze_y, 2)) if gaze_y is not None else "",
            "object_type": object_type,
            "confidence": str(round(confidence, 2)),
            "label": label,
            "timestamp": str(time.time())
        }
        redis_client.xadd("telemetry_ingest", event)

    # --- Camera 1: Entrance/Exit Foyer (CCTV Feed 1 Person Detection) ---
    def _simulate_camera_1(self):
        persistent_entities = [
            # Customer #1: Shopper pushing blue cart along entrance walkway (middle-left)
            {
                "id": 101, "camera_id": 1, "x": 34.0, "y": 58.0, "vx": 0.0, "vy": 0.0,
                "gaze_target": "Main Store Foyer Entrance", "gaze_x": 16.0, "gaze_y": 55.0,
                "object_type": "person", "confidence": 0.96, "label": "Customer", "active": True
            },
            # Customer #2: Shopper standing under awning near cart bay (center)
            {
                "id": 102, "camera_id": 1, "x": 68.0, "y": 60.0, "vx": 0.0, "vy": 0.0,
                "gaze_target": "Shopping Cart Bay", "gaze_x": 58.0, "gaze_y": 56.0,
                "object_type": "person", "confidence": 0.97, "label": "Customer", "active": True
            },
            # Customer #3: Shopper in tank top on the right near cart return
            {
                "id": 103, "camera_id": 1, "x": 82.0, "y": 62.0, "vx": 0.0, "vy": 0.0,
                "gaze_target": "Entrance Promo Display", "gaze_x": 62.0, "gaze_y": 54.0,
                "object_type": "person", "confidence": 0.98, "label": "Customer", "active": True
            }
        ]

        for ent in persistent_entities:
            sid = ent["id"]
            if sid not in self.shoppers:
                ent["dwell_time"] = random.randint(10, 80)
                self.shoppers[sid] = ent
            else:
                s = self.shoppers[sid]
                s["active"] = True
                s["dwell_time"] += 1
                s["x"] = ent["x"]
                s["y"] = ent["y"]
                self._push_event(1, sid, s["x"], s["y"], s["dwell_time"], s["gaze_target"], s["gaze_x"], s["gaze_y"], s.get("object_type", "person"), s.get("confidence", 0.96), s.get("label", "Customer"))

    # --- Camera 2: Main Product Aisle A (Grocery.mp4 Video) ---
    def _simulate_camera_2(self):
        persistent_entities = [
            # Customer #1: Shopper browsing grocery & pantry display shelf
            {
                "id": 201, "camera_id": 2, "x": 42.0, "y": 58.0, "vx": 0.0, "vy": 0.0,
                "gaze_target": "Grocery & Pantry Display Shelf", "gaze_x": 68.0, "gaze_y": 52.0,
                "object_type": "person", "confidence": 0.97, "label": "Customer", "active": True
            },
            # Customer #2: Shopper standing near beverage rack
            {
                "id": 202, "camera_id": 2, "x": 68.0, "y": 64.0, "vx": 0.0, "vy": 0.0,
                "gaze_target": "Beverages & Sodas Rack", "gaze_x": 82.0, "gaze_y": 58.0,
                "object_type": "person", "confidence": 0.95, "label": "Customer", "active": True
            }
        ]

        for ent in persistent_entities:
            sid = ent["id"]
            if sid not in self.shoppers:
                ent["dwell_time"] = random.randint(10, 90)
                self.shoppers[sid] = ent
            else:
                s = self.shoppers[sid]
                s["active"] = True
                s["dwell_time"] += 1
                s["x"] = ent["x"]
                s["y"] = ent["y"]
                self._push_event(2, sid, s["x"], s["y"], s["dwell_time"], s["gaze_target"], s["gaze_x"], s["gaze_y"], s.get("object_type", "person"), s.get("confidence", 0.96), s.get("label", "Customer"))

        # Dynamic produce aisle shoppers
        aisle_shoppers = [s for s in self.shoppers.values() if s["camera_id"] == 2 and s["id"] >= 205 and s["active"]]
        if len(aisle_shoppers) < 2 and random.random() < 0.20:
            sid = self.next_shopper_id
            if sid < 205: sid = 205
            self.next_shopper_id = sid + 1
            self.shoppers[sid] = {
                "id": sid,
                "camera_id": 2,
                "x": random.uniform(50.0, 70.0),
                "y": 75.0,
                "vx": random.uniform(-0.3, 0.3),
                "vy": random.uniform(-1.0, -0.5),
                "dwell_time": 0,
                "gaze_target": "Fresh Fruits Section",
                "gaze_x": 80.0,
                "gaze_y": 60.0,
                "object_type": "person",
                "confidence": round(random.uniform(0.92, 0.96), 2),
                "label": "Customer",
                "active": True
            }

        # Update dynamic produce aisle shoppers
        for sid, s in list(self.shoppers.items()):
            if s["camera_id"] == 2 and sid >= 205 and s["active"]:
                s["dwell_time"] += 1
                s["x"] += s["vx"]
                s["y"] += s["vy"]
                if s["y"] < 52.0 or s["y"] > 85.0:
                    s["active"] = False
                    del self.shoppers[sid]
                    continue
                
                gaze_x = s["gaze_x"]
                gaze_y = s["gaze_y"]
                self._push_event(2, sid, s["x"], s["y"], s["dwell_time"], s["gaze_target"], gaze_x, gaze_y, s.get("object_type", "person"), s.get("confidence", 0.95), s.get("label", "Customer"))

    # --- Camera 3: Main Product Aisle B (Checkout / Grocery Video) ---
    def _simulate_camera_3(self):
        persistent_entities = [
            # Customer #1 walking down main aisle with cart
            {
                "id": 301, "camera_id": 3, "x": 35.0, "y": 58.0, "vx": 0.0, "vy": 0.0,
                "gaze_target": "Grocery Display Shelf", "gaze_x": 22.0, "gaze_y": 52.0,
                "object_type": "person", "confidence": 0.96, "label": "Customer", "active": True
            },
            # Customer #2 browsing product display shelf
            {
                "id": 302, "camera_id": 3, "x": 65.0, "y": 62.0, "vx": 0.0, "vy": 0.0,
                "gaze_target": "Specialty Snack Display", "gaze_x": 78.0, "gaze_y": 55.0,
                "object_type": "person", "confidence": 0.95, "label": "Customer", "active": True
            }
        ]

        for ent in persistent_entities:
            sid = ent["id"]
            if sid not in self.shoppers:
                ent["dwell_time"] = random.randint(15, 110)
                self.shoppers[sid] = ent
            else:
                s = self.shoppers[sid]
                s["active"] = True
                s["dwell_time"] += 1
                s["x"] = ent["x"]
                s["y"] = ent["y"]
                self._push_event(3, sid, s["x"], s["y"], s["dwell_time"], s["gaze_target"], s["gaze_x"], s["gaze_y"], s.get("object_type", "person"), s.get("confidence", 0.96), s.get("label", "Customer"))

        # Dynamic aisle shoppers walking down center aisle floor
        aisle_shoppers = [s for s in self.shoppers.values() if s["camera_id"] == 3 and s["id"] >= 307 and s["active"]]
        if len(aisle_shoppers) < 2 and random.random() < 0.20:
            sid = self.next_shopper_id
            if sid < 307: sid = 307
            self.next_shopper_id = sid + 1
            self.shoppers[sid] = {
                "id": sid,
                "camera_id": 3,
                "x": random.uniform(35.0, 65.0),
                "y": 52.0,
                "vx": random.uniform(-0.2, 0.2),
                "vy": random.uniform(0.5, 1.0),
                "dwell_time": 0,
                "gaze_target": "Hypermarket Aisle",
                "gaze_x": 47.0,
                "gaze_y": 65.0,
                "object_type": "person",
                "confidence": round(random.uniform(0.91, 0.96), 2),
                "label": "Customer",
                "active": True
            }

        for sid, s in list(self.shoppers.items()):
            if s["camera_id"] == 3 and sid >= 307 and s["active"]:
                s["dwell_time"] += 1
                s["x"] += s["vx"]
                s["y"] += s["vy"]
                if s["y"] > 85.0:
                    s["active"] = False
                    del self.shoppers[sid]
                    continue
                gaze_x = s["gaze_x"]
                gaze_y = s["gaze_y"]
                self._push_event(3, sid, s["x"], s["y"], s["dwell_time"], s["gaze_target"], gaze_x, gaze_y, s.get("object_type", "person"), s.get("confidence", 0.95), s.get("label", "Customer"))

    # --- Camera 4 / Camera 7: Checkout Lanes (checkout.mp4 & checkout2.mp4 Video) ---
    def _simulate_camera_4(self):
        persistent_entities = [
            # Cashier #401 at blue register belt (bottom left)
            {
                "id": 401, "camera_id": 4, "x": 30.0, "y": 68.0, "vx": 0.0, "vy": 0.0,
                "gaze_target": "POS Register Terminal", "gaze_x": 46.0, "gaze_y": 64.0,
                "object_type": "cashier", "confidence": 0.98, "label": "Cashier", "active": True
            },
            # Customer #402 paying at checkout counter (middle left)
            {
                "id": 402, "camera_id": 4, "x": 44.0, "y": 60.0, "vx": 0.0, "vy": 0.0,
                "gaze_target": "Checkout Counter", "gaze_x": 30.0, "gaze_y": 68.0,
                "object_type": "person", "confidence": 0.96, "label": "Customer", "active": True
            },
            # Customer #403 pushing shopping cart along register aisle (right)
            {
                "id": 403, "camera_id": 4, "x": 68.0, "y": 64.0, "vx": 0.0, "vy": 0.0,
                "gaze_target": "Impulse Snack Rack", "gaze_x": 75.0, "gaze_y": 58.0,
                "object_type": "person", "confidence": 0.95, "label": "Customer", "active": True
            }
        ]

        for ent in persistent_entities:
            sid = ent["id"]
            if sid not in self.shoppers:
                ent["dwell_time"] = random.randint(15, 120)
                self.shoppers[sid] = ent
            else:
                s = self.shoppers[sid]
                s["active"] = True
                s["dwell_time"] += 1
                s["x"] = ent["x"]
                s["y"] = ent["y"]
                self._push_event(4, sid, s["x"], s["y"], s["dwell_time"], s["gaze_target"], s["gaze_x"], s["gaze_y"], s.get("object_type", "person"), s.get("confidence", 0.96), s.get("label", s.get("label", "Customer")))

    # --- Camera 5: Section 5 (cctv_5.mp4 Video) ---
    def _simulate_camera_5(self):
        persistent_entities = [
            {
                "id": 501, "camera_id": 5, "x": 38.0, "y": 58.0, "vx": 0.0, "vy": 0.0,
                "gaze_target": "Specialty Apparel Rack", "gaze_x": 55.0, "gaze_y": 52.0,
                "object_type": "person", "confidence": 0.96, "label": "Customer", "active": True
            },
            {
                "id": 502, "camera_id": 5, "x": 72.0, "y": 62.0, "vx": 0.0, "vy": 0.0,
                "gaze_target": "Footwear Display", "gaze_x": 84.0, "gaze_y": 56.0,
                "object_type": "person", "confidence": 0.95, "label": "Customer", "active": True
            }
        ]
        for ent in persistent_entities:
            sid = ent["id"]
            if sid not in self.shoppers:
                ent["dwell_time"] = random.randint(10, 90)
                self.shoppers[sid] = ent
            else:
                s = self.shoppers[sid]
                s["active"] = True
                s["dwell_time"] += 1
                s["x"] = ent["x"]
                s["y"] = ent["y"]
                self._push_event(5, sid, s["x"], s["y"], s["dwell_time"], s["gaze_target"], s["gaze_x"], s["gaze_y"], s.get("object_type", "person"), s.get("confidence", 0.96), s.get("label", "Customer"))

    # --- Camera 6: Promotion Zone (cctv_6.mp4 Video) ---
    def _simulate_camera_6(self):
        persistent_entities = [
            {
                "id": 601, "camera_id": 6, "x": 42.0, "y": 60.0, "vx": 0.0, "vy": 0.0,
                "gaze_target": "Seasonal Promo Stand", "gaze_x": 28.0, "gaze_y": 54.0,
                "object_type": "person", "confidence": 0.97, "label": "Customer", "active": True
            },
            {
                "id": 602, "camera_id": 6, "x": 65.0, "y": 64.0, "vx": 0.0, "vy": 0.0,
                "gaze_target": "Discount Endcap Rack", "gaze_x": 78.0, "gaze_y": 58.0,
                "object_type": "person", "confidence": 0.94, "label": "Customer", "active": True
            }
        ]
        for ent in persistent_entities:
            sid = ent["id"]
            if sid not in self.shoppers:
                ent["dwell_time"] = random.randint(15, 100)
                self.shoppers[sid] = ent
            else:
                s = self.shoppers[sid]
                s["active"] = True
                s["dwell_time"] += 1
                s["x"] = ent["x"]
                s["y"] = ent["y"]
                self._push_event(6, sid, s["x"], s["y"], s["dwell_time"], s["gaze_target"], s["gaze_x"], s["gaze_y"], s.get("object_type", "person"), s.get("confidence", 0.96), s.get("label", "Customer"))

    # --- Camera 7: Checkout Lanes 2 (cctv_7.mp4 Video) ---
    def _simulate_camera_7(self):
        persistent_entities = [
            {
                "id": 701, "camera_id": 7, "x": 32.0, "y": 66.0, "vx": 0.0, "vy": 0.0,
                "gaze_target": "POS Terminal 2", "gaze_x": 48.0, "gaze_y": 62.0,
                "object_type": "cashier", "confidence": 0.98, "label": "Cashier", "active": True
            },
            {
                "id": 702, "camera_id": 7, "x": 52.0, "y": 62.0, "vx": 0.0, "vy": 0.0,
                "gaze_target": "Checkout Register 2", "gaze_x": 32.0, "gaze_y": 66.0,
                "object_type": "person", "confidence": 0.96, "label": "Customer", "active": True
            }
        ]
        for ent in persistent_entities:
            sid = ent["id"]
            if sid not in self.shoppers:
                ent["dwell_time"] = random.randint(10, 110)
                self.shoppers[sid] = ent
            else:
                s = self.shoppers[sid]
                s["active"] = True
                s["dwell_time"] += 1
                s["x"] = ent["x"]
                s["y"] = ent["y"]
                self._push_event(7, sid, s["x"], s["y"], s["dwell_time"], s["gaze_target"], s["gaze_x"], s["gaze_y"], s.get("object_type", "person"), s.get("confidence", 0.96), s.get("label", s.get("label", "Customer")))

    # --- Camera 8: Store Exit (cctv_8.mp4 Video) ---
    def _simulate_camera_8(self):
        persistent_entities = [
            {
                "id": 801, "camera_id": 8, "x": 45.0, "y": 60.0, "vx": 0.0, "vy": 0.0,
                "gaze_target": "Automatic Exit Gate", "gaze_x": 30.0, "gaze_y": 55.0,
                "object_type": "person", "confidence": 0.97, "label": "Customer", "active": True
            },
            {
                "id": 802, "camera_id": 8, "x": 70.0, "y": 62.0, "vx": 0.0, "vy": 0.0,
                "gaze_target": "Receipt Check Station", "gaze_x": 82.0, "gaze_y": 58.0,
                "object_type": "person", "confidence": 0.96, "label": "Customer", "active": True
            }
        ]
        for ent in persistent_entities:
            sid = ent["id"]
            if sid not in self.shoppers:
                ent["dwell_time"] = random.randint(5, 60)
                self.shoppers[sid] = ent
            else:
                s = self.shoppers[sid]
                s["active"] = True
                s["dwell_time"] += 1
                s["x"] = ent["x"]
                s["y"] = ent["y"]
                self._push_event(8, sid, s["x"], s["y"], s["dwell_time"], s["gaze_target"], s["gaze_x"], s["gaze_y"], s.get("object_type", "person"), s.get("confidence", 0.96), s.get("label", "Customer"))

# Global simulator instance
camera_simulator = CameraSimulator()
