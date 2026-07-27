import os
import time
import base64
from datetime import datetime, timedelta
import cv2
import numpy as np

class VideoStreamIngester:
    def __init__(self, camera_name: str = None, target_width: int = 320, target_height: int = 240):
        # We target 320x240 by default for the base64 JPEGs to ensure small payload size and high performance
        self.camera_name = camera_name or "CAM-ENT-01"
        self.target_width = target_width
        self.target_height = target_height
        
        self.source_path = os.path.join(os.path.dirname(__file__), f"mock_retail_{self.camera_name}.mp4")
        # Regenerate the simulation video to ensure the latest visual overlays are used
        self._generate_mock_video(self.source_path, self.camera_name)

    def _generate_mock_video(self, output_path: str, camera_name: str, num_frames: int = 60):
        """Generates a highly-detailed MP4 file simulating CV detection for a specific camera."""
        # Check and remove old version if exists to force update
        if os.path.exists(output_path):
            try:
                os.remove(output_path)
            except Exception:
                pass # If file is locked, we will just try to overwrite it

        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # We generate the video at 640x480 resolution (it will be downscaled to 320x240 on ingestion for speed)
        fourcc = cv2.VideoWriter_fourcc(*'MJPG')
        out = cv2.VideoWriter(output_path, fourcc, 10.0, (640, 480))
        if not out.isOpened():
            # Fallback if MJPG is not supported
            fourcc = cv2.VideoWriter_fourcc(*'XVID')
            out = cv2.VideoWriter(output_path, fourcc, 10.0, (640, 480))

        # Base timestamp for the HUD overlay (starts at now)
        base_time = datetime.utcnow()

        # Set up coordinates and configurations based on camera
        if camera_name == "CAM-FMCG-04":
            zone_label = "Personal Care Aisle"
            shelf_code = "S-FMCG-04"
            shelf_cat = "Personal Care"
            shelf_rect = ((340, 150), (480, 360))
            
            # Shopper 1 (Teal): Walks through, doesn't pause much
            # Shopper 2 (Magenta): Enters at frame 8, walks to shelf, dwells, picks up toothpaste, exits
            def get_shopper_positions(frame_idx):
                shoppers = []
                # Shopper 1
                s1_x = 80 + frame_idx * 8
                s1_y = 120 + int(np.sin(frame_idx / 3.0) * 20)
                shoppers.append({"id": 101, "pos": (s1_x, s1_y), "color": (166, 184, 20), "label": "Shopper #101"}) # BGR Teal
                
                # Shopper 2
                if frame_idx >= 8:
                    idx = frame_idx - 8
                    if idx < 15: # Enter and walk to shelf
                        s2_x = 280
                        s2_y = 50 + idx * 12
                        dwelling = False
                        pickup = False
                    elif idx < 42: # Dwell near shelf
                        s2_x = 280 + int(np.sin((idx - 15) / 2.0) * 5)
                        s2_y = 230 + int(np.cos((idx - 15) / 2.0) * 5)
                        dwelling = True
                        pickup = (20 <= idx <= 35) # Pickup toothpaste gesture
                    else: # Exit
                        exit_idx = idx - 42
                        s2_x = 280 - exit_idx * 12
                        s2_y = 230 + exit_idx * 15
                        dwelling = False
                        pickup = False
                    
                    shoppers.append({
                        "id": 102, 
                        "pos": (s2_x, s2_y), 
                        "color": (219, 39, 119), # BGR Magenta
                        "label": "Shopper #102",
                        "dwelling": dwelling,
                        "pickup": pickup,
                        "gaze_target": (410, 255) # Shelf center
                    })
                return shoppers

        elif camera_name == "CAM-BEV-02":
            zone_label = "Beverage Wall"
            shelf_code = "S-BEV-02"
            shelf_cat = "Beverages"
            shelf_rect = ((120, 60), (520, 140))
            
            # Shopper 1 (Amber): Enters, walks to Beverage Wall, dwells, exits
            # Shopper 2 (Green): Walks right to left
            def get_shopper_positions(frame_idx):
                shoppers = []
                
                # Shopper 1
                if frame_idx < 18:
                    s1_x = 80 + frame_idx * 12
                    s1_y = 240 + int(np.sin(frame_idx / 2.0) * 15)
                    dwelling = False
                elif frame_idx < 48:
                    idx = frame_idx - 18
                    s1_x = 296 + int(np.sin(idx / 3.0) * 6)
                    s1_y = 200 + int(np.cos(idx / 3.0) * 6)
                    dwelling = True
                else:
                    idx = frame_idx - 48
                    s1_x = 300 + idx * 18
                    s1_y = 200 + idx * 12
                    dwelling = False
                    
                shoppers.append({
                    "id": 201, 
                    "pos": (s1_x, s1_y), 
                    "color": (6, 119, 217), # BGR Amber
                    "label": "Shopper #201",
                    "dwelling": dwelling,
                    "pickup": False,
                    "gaze_target": (320, 100) # Shelf center
                })
                
                # Shopper 2
                s2_x = 580 - frame_idx * 9
                s2_y = 350 - int(np.sin(frame_idx / 4.0) * 30)
                shoppers.append({"id": 202, "pos": (s2_x, s2_y), "color": (34, 197, 94), "label": "Shopper #202"}) # BGR Green
                
                return shoppers

        else: # CAM-ENT-01 (Entrance Promo Bay)
            zone_label = "Entrance Promo Bay"
            shelf_code = "S-PROMO-01"
            shelf_cat = "Promotions"
            shelf_rect = ((140, 90), (280, 240))
            
            # Shopper 1 (Teal): Enters, dwells at Promo shelf, walks out
            # Shopper 2 (Amber): Crosses diagonally
            def get_shopper_positions(frame_idx):
                shoppers = []
                
                # Shopper 1
                if frame_idx < 15:
                    s1_x = 60 + frame_idx * 11
                    s1_y = 380 - frame_idx * 8
                    dwelling = False
                elif frame_idx < 45:
                    idx = frame_idx - 15
                    s1_x = 225 + int(np.cos(idx / 2.0) * 5)
                    s1_y = 260 + int(np.sin(idx / 2.0) * 5)
                    dwelling = True
                else:
                    idx = frame_idx - 45
                    s1_x = 225 + idx * 15
                    s1_y = 260 - idx * 10
                    dwelling = False
                    
                shoppers.append({
                    "id": 301,
                    "pos": (s1_x, s1_y),
                    "color": (166, 184, 20), # BGR Teal
                    "label": "Shopper #301",
                    "dwelling": dwelling,
                    "pickup": False,
                    "gaze_target": (210, 165) # Shelf center
                })
                
                # Shopper 2
                s2_x = 100 + frame_idx * 7
                s2_y = 120 + frame_idx * 4
                shoppers.append({"id": 302, "pos": (s2_x, s2_y), "color": (6, 119, 217), "label": "Shopper #302"}) # BGR Amber
                
                return shoppers

        # Helper to store path history trails
        history = {}

        for i in range(num_frames):
            # Create a premium dark theme background frame (slate color: RGB (13, 20, 35))
            img = np.zeros((480, 640, 3), dtype=np.uint8)
            img[:] = [35, 20, 13]  # BGR order (13, 20, 35)

            # Draw a subtle grid blueprint pattern
            for y in range(0, 480, 40):
                cv2.line(img, (0, y), (640, y), (45, 30, 20), 1)
            for x in range(0, 640, 40):
                cv2.line(img, (x, 0), (x, 480), (45, 30, 20), 1)

            # 1. Draw Shelf
            s_color = (20, 184, 166) if camera_name == "CAM-ENT-01" else (217, 119, 6) if camera_name == "CAM-BEV-02" else (219, 39, 119)
            cv2.rectangle(img, shelf_rect[0], shelf_rect[1], (48, 30, 22), -1) # Shelf fill
            cv2.rectangle(img, shelf_rect[0], shelf_rect[1], s_color, 2) # Shelf border
            
            # Shelf Text
            cv2.putText(img, f"SHELF: {shelf_code}", (shelf_rect[0][0] + 10, shelf_rect[0][1] + 25), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1, cv2.LINE_AA)
            cv2.putText(img, f"CAT: {shelf_cat}", (shelf_rect[0][0] + 10, shelf_rect[0][1] + 45), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.35, (160, 160, 160), 1, cv2.LINE_AA)

            # 2. Get and draw shoppers
            shoppers = get_shopper_positions(i)
            for s in shoppers:
                s_id = s["id"]
                cx, cy = s["pos"]
                s_color_bgr = s["color"]
                
                # Update path history
                if s_id not in history:
                    history[s_id] = []
                history[s_id].append((cx, cy))
                
                # Draw history trail line
                if len(history[s_id]) > 1:
                    pts = np.array(history[s_id], np.int32)
                    pts = pts.reshape((-1, 1, 2))
                    cv2.polylines(img, [pts], False, s_color_bgr, 1, cv2.LINE_AA)

                # Check boundaries and draw shopper bounding box
                if 20 < cx < 620 and 40 < cy < 440:
                    is_dwelling = s.get("dwelling", False)
                    is_pickup = s.get("pickup", False)
                    
                    # If dwelling, double bounding box for emphasis or make it flash
                    box_color = (0, 165, 255) if is_dwelling else s_color_bgr # Warning orange when dwelling
                    if is_pickup:
                        box_color = (0, 0, 255) # Red when picking up product
                        
                    cv2.rectangle(img, (cx - 25, cy - 45), (cx + 25, cy + 45), box_color, 2)
                    
                    # Bounding Box label
                    lbl = f"ID:{s_id} | CONF:0.95"
                    cv2.rectangle(img, (cx - 25, cy - 60), (cx + 25, cy - 45), box_color, -1)
                    cv2.putText(img, lbl, (cx - 22, cy - 50), cv2.FONT_HERSHEY_SIMPLEX, 0.3, (255, 255, 255), 1, cv2.LINE_AA)
                    
                    # Draw Gaze vector line
                    if is_dwelling and "gaze_target" in s:
                        gt_x, gt_y = s["gaze_target"]
                        # Draw dashed-like lines using multiple short segments
                        cv2.line(img, (cx, cy), (gt_x, gt_y), (0, 165, 255), 1, cv2.LINE_AA)
                        cv2.circle(img, (gt_x, gt_y), 4, (0, 165, 255), -1)
                        # Add gaze label
                        cv2.putText(img, "GAZE DETECTED", (cx - 30, cy + 60), 
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.35, (0, 165, 255), 1, cv2.LINE_AA)
                        cv2.putText(img, "DWELL ACTIVE", (cx - 25, cy + 72), 
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.3, (0, 140, 255), 1, cv2.LINE_AA)

                    # Draw Pickup gesture bounding box overlay
                    if is_pickup:
                        # Draw bounding box for hand interaction
                        cv2.rectangle(img, (cx - 15, cy - 10), (cx + 35, cy + 30), (0, 255, 255), 1)
                        cv2.putText(img, "GESTURE: PICKUP", (cx - 40, cy + 60), 
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.35, (0, 255, 255), 1, cv2.LINE_AA)
                        cv2.putText(img, "SKU DETECTED", (cx - 30, cy + 72), 
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.3, (0, 255, 255), 1, cv2.LINE_AA)

            # 3. Draw HUD overlays
            # Time ticks (10 frames = 1 second)
            current_time = base_time + timedelta(seconds=i * 0.1)
            time_str = current_time.strftime("%Y-%m-%d %H:%M:%S") + f".{i % 10}0"

            # Top Header Bar background
            cv2.rectangle(img, (0, 0), (640, 35), (20, 10, 5), -1)
            cv2.line(img, (0, 35), (640, 35), (60, 40, 20), 1)

            # Blinking REC dot
            if (i // 5) % 2 == 0:
                cv2.circle(img, (20, 17), 5, (0, 0, 255), -1)
                cv2.putText(img, "REC", (32, 21), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1, cv2.LINE_AA)
            else:
                cv2.putText(img, "REC", (32, 21), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (120, 120, 120), 1, cv2.LINE_AA)

            # Camera title & details
            hdr_text = f"FEED: {camera_name} | ZONE: {zone_label} | FPS: 29.8 | RESOLUTION: 640x480"
            cv2.putText(img, hdr_text, (90, 21), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (200, 200, 200), 1, cv2.LINE_AA)

            # Clock
            cv2.putText(img, time_str, (470, 21), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (0, 230, 240), 1, cv2.LINE_AA)

            # Bottom Status Bar background
            cv2.rectangle(img, (0, 445), (640, 480), (20, 10, 5), -1)
            cv2.line(img, (0, 445), (640, 445), (60, 40, 20), 1)

            # Bottom info text
            ftr_text = "CV PIPELINE: ACTIVE | MODELS: YOLOv8-COCO / GAZE-NET-V2 | STATE: TRACKING"
            cv2.putText(img, ftr_text, (15, 465), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (0, 255, 180), 1, cv2.LINE_AA)

            out.write(img)
            
        out.release()

    def run_ingestion_test(self, limit_frames: int = 60) -> list:
        """Reads frames, downscales them to 320x240, converts to base64, and returns logs."""
        if not os.path.exists(self.source_path):
            raise FileNotFoundError(f"Source stream target does not exist: {self.source_path}")
            
        cap = cv2.VideoCapture(self.source_path)
        frame_logs = []
        frame_count = 0
        
        try:
            while cap.isOpened() and frame_count < limit_frames:
                ret, frame = cap.read()
                if not ret:
                    break
                    
                frame_count += 1
                
                # Resize to target downscale resolution for fast network transport
                resized_frame = cv2.resize(frame, (self.target_width, self.target_height))
                
                # Compress to JPEG
                _, buffer = cv2.imencode('.jpg', resized_frame, [int(cv2.IMWRITE_JPEG_QUALITY), 70])
                # Convert to base64 string
                img_base64 = base64.b64encode(buffer).decode('utf-8')
                
                # Extract image metrics
                avg_brightness = float(resized_frame.mean())
                timestamp = datetime.utcnow().isoformat()
                
                log_entry = {
                    "frame_index": frame_count,
                    "timestamp": timestamp,
                    "original_resolution": "640x480",
                    "processed_resolution": f"{self.target_width}x{self.target_height}",
                    "average_brightness": round(avg_brightness, 2),
                    "status": "stable_processing",
                    "frame_image": f"data:image/jpeg;base64,{img_base64}"
                }
                frame_logs.append(log_entry)
        finally:
            cap.release()
            
        return frame_logs
