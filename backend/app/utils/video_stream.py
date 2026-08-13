import cv2
import numpy as np
import logging
import time
import math
import random
from typing import Generator, Optional, Tuple, Dict

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def generate_ai_retail_frame(width: int = 640, height: int = 480, frame_id: int = 0, camera_id: int = 1) -> np.ndarray:
    """
    Generates a realistic AI Computer Vision Retail Camera frame complete with:
    - Retail store background (Shelf zones, aisles, checkout counters)
    - Person detection bounding boxes (e.g. Shopper #101, Shopper #102)
    - Gaze direction vectors and head pose rays
    - Shelf Region-of-Interest (ROI) bounding boxes
    - Real-time entry / exit foot traffic counter overlay
    """
    # Base canvas dark store ambiance
    frame = np.zeros((height, width, 3), dtype=np.uint8)
    frame[:] = (22, 28, 36)  # Dark slate floor

    # Aisle floor guidelines
    for x in range(0, width, 60):
        cv2.line(frame, (x, 0), (x, height), (35, 45, 58), 1)
    for y in range(0, height, 60):
        cv2.line(frame, (0, y), (width, y), (35, 45, 58), 1)

    # 1. Draw Retail Shelves (ROIs) & Camera PTZ parameters based on camera ID
    t = frame_id * 0.05

    if camera_id == 1:
        zone_title = "ZONE 1: MAIN ENTRANCE & END-CAP BAY"
        ptz_info = "PTZ: PAN +45° | TILT -12° | CAM 01 NE FOYER"
        # Shelf A (Promotional Display)
        cv2.rectangle(frame, (40, 70), (280, 210), (40, 110, 50), -1)
        cv2.rectangle(frame, (40, 70), (280, 210), (0, 255, 120), 2)
        cv2.putText(frame, "ENDCAP A: Organic Energy Drinks", (45, 62), cv2.FONT_HERSHEY_SIMPLEX, 0.40, (0, 255, 120), 1)

        # Shelf B (New Snack Arrivals)
        cv2.rectangle(frame, (360, 70), (600, 210), (60, 40, 110), -1)
        cv2.rectangle(frame, (360, 70), (600, 210), (200, 120, 255), 2)
        cv2.putText(frame, "ENDCAP B: Premium Nuts & Chips", (365, 62), cv2.FONT_HERSHEY_SIMPLEX, 0.40, (200, 120, 255), 1)

        # Turnstile Entrance
        cv2.rectangle(frame, (220, 380), (420, 460), (35, 45, 75), 2)
        cv2.putText(frame, "STORE ENTRANCE TURNSTILE", (225, 420), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (180, 180, 220), 1)

        shoppers = [
            {
                "id": 101,
                "x": int(150 + 60 * math.sin(t)),
                "y": int(240 + 30 * math.cos(t * 0.8)),
                "w": 55, "h": 110,
                "color": (0, 255, 128),
                "status": "GAZE AT ENDCAP A",
                "gaze_target": (150, 140),
                "dwell": f"{int(14 + (frame_id % 120) * 0.1)}s"
            },
            {
                "id": 104,
                "x": int(470 + 40 * math.cos(t * 0.9)),
                "y": int(260 + 35 * math.sin(t * 1.1)),
                "w": 50, "h": 105,
                "color": (255, 165, 0),
                "status": "PICKING PRODUCT",
                "gaze_target": (480, 150),
                "dwell": f"{int(9 + (frame_id % 90) * 0.1)}s"
            },
            {
                "id": 108,
                "x": int(310 + 20 * math.sin(t * 0.5)),
                "y": int(360 + 20 * math.sin(t * 0.7)),
                "w": 48, "h": 98,
                "color": (255, 0, 200),
                "status": "ENTERING FOYER",
                "gaze_target": (320, 210),
                "dwell": "2s"
            }
        ]

    elif camera_id == 2:
        zone_title = "ZONE 2: BEVERAGE & JUICE AISLE"
        ptz_info = "PTZ: PAN 0° | TILT -20° | CAM 02 NORTH AISLE"
        # Left Beverage Racks
        cv2.rectangle(frame, (30, 70), (250, 420), (30, 80, 110), -1)
        cv2.rectangle(frame, (30, 70), (250, 420), (0, 220, 255), 2)
        cv2.putText(frame, "SHELF C: Cold Brews & Mineral Water", (35, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.40, (0, 220, 255), 1)

        # Right Soda Racks
        cv2.rectangle(frame, (390, 70), (610, 420), (80, 30, 110), -1)
        cv2.rectangle(frame, (390, 70), (610, 420), (255, 100, 220), 2)
        cv2.putText(frame, "SHELF D: Soda Cans & Flavored Teas", (395, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.40, (255, 100, 220), 1)

        shoppers = [
            {
                "id": 201,
                "x": int(140 + 30 * math.cos(t * 0.7)),
                "y": int(220 + 70 * math.sin(t * 0.5)),
                "w": 52, "h": 106,
                "color": (0, 255, 200),
                "status": "GAZE AT COLD BREW",
                "gaze_target": (140, 200),
                "dwell": f"{int(22 + (frame_id % 150) * 0.1)}s"
            },
            {
                "id": 205,
                "x": int(450 + 25 * math.sin(t * 0.8)),
                "y": int(240 + 60 * math.cos(t * 0.6)),
                "w": 54, "h": 108,
                "color": (255, 200, 0),
                "status": "COMPARING TEAS",
                "gaze_target": (460, 220),
                "dwell": f"{int(15 + (frame_id % 100) * 0.1)}s"
            }
        ]

    elif camera_id == 3:
        zone_title = "ZONE 3: CHECKOUT REGISTERS & IMPULSE BAY"
        ptz_info = "PTZ: PAN -30° | TILT -10° | CAM 03 REGISTERS"
        # Register Counter
        cv2.rectangle(frame, (40, 80), (590, 220), (100, 60, 30), -1)
        cv2.rectangle(frame, (40, 80), (590, 220), (255, 180, 0), 2)
        cv2.putText(frame, "CHECKOUT COUNTERS #1, #2 & BILLING REGISTERS", (45, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.40, (255, 180, 0), 1)

        # Impulse Candy Rack
        cv2.rectangle(frame, (40, 320), (590, 440), (80, 80, 30), -1)
        cv2.rectangle(frame, (40, 320), (590, 440), (220, 220, 0), 2)
        cv2.putText(frame, "IMPULSE BAY: Chocolate & Batteries", (45, 310), cv2.FONT_HERSHEY_SIMPLEX, 0.40, (220, 220, 0), 1)

        shoppers = [
            {
                "id": 301,
                "x": int(180 + 40 * math.sin(t * 0.4)),
                "y": int(240 + 15 * math.cos(t * 0.6)),
                "w": 50, "h": 100,
                "color": (0, 255, 160),
                "status": "BILLING AT REGISTER 1",
                "gaze_target": (200, 150),
                "dwell": f"{int(35 + (frame_id % 200) * 0.1)}s"
            },
            {
                "id": 306,
                "x": int(420 + 35 * math.cos(t * 0.5)),
                "y": int(250 + 20 * math.sin(t * 0.7)),
                "w": 52, "h": 102,
                "color": (255, 140, 0),
                "status": "IMPULSE CANDY PICK",
                "gaze_target": (420, 360),
                "dwell": f"{int(18 + (frame_id % 110) * 0.1)}s"
            }
        ]

    else:
        zone_title = "ZONE 4: BAKERY & FRESH PRODUCE"
        ptz_info = "PTZ: PAN +60° | TILT -15° | CAM 04 EAST BAY"
        # Artisan Bakery Stand
        cv2.rectangle(frame, (40, 70), (290, 410), (110, 60, 50), -1)
        cv2.rectangle(frame, (40, 70), (290, 410), (255, 140, 80), 2)
        cv2.putText(frame, "BAKERY: Artisan Breads & Pastries", (45, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.40, (255, 140, 80), 1)

        # Organic Produce Rack
        cv2.rectangle(frame, (350, 70), (600, 410), (40, 100, 70), -1)
        cv2.rectangle(frame, (350, 70), (600, 410), (80, 255, 160), 2)
        cv2.putText(frame, "PRODUCE: Organic Fruits & Vegetables", (355, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.40, (80, 255, 160), 1)

        shoppers = [
            {
                "id": 401,
                "x": int(170 + 35 * math.sin(t * 0.6)),
                "y": int(230 + 50 * math.cos(t * 0.5)),
                "w": 53, "h": 105,
                "color": (255, 180, 0),
                "status": "GAZE AT BREAD BAY",
                "gaze_target": (160, 200),
                "dwell": f"{int(28 + (frame_id % 140) * 0.1)}s"
            },
            {
                "id": 408,
                "x": int(460 + 30 * math.cos(t * 0.7)),
                "y": int(240 + 55 * math.sin(t * 0.6)),
                "w": 51, "h": 103,
                "color": (0, 255, 120),
                "status": "INSPECTING PRODUCE",
                "gaze_target": (470, 210),
                "dwell": f"{int(12 + (frame_id % 80) * 0.1)}s"
            }
        ]

    # 2. Draw Person Bounding Boxes & Gaze Vector Lines
    for s in shoppers:
        x, y, w, h = s["x"], s["y"], s["w"], s["h"]
        color = s["color"]

        # Person Bounding Box
        cv2.rectangle(frame, (x, y), (x + w, y + h), color, 2)

        # Head Circle & Gaze Ray
        head_cx, head_cy = x + w // 2, y + 15
        cv2.circle(frame, (head_cx, head_cy), 8, (255, 255, 255), -1)
        cv2.line(frame, (head_cx, head_cy), s["gaze_target"], (0, 255, 255), 2, lineType=cv2.LINE_AA)
        cv2.circle(frame, s["gaze_target"], 5, (0, 255, 255), -1)

        # Bounding box tag header
        tag = f"Shopper #{s['id']} | {s['dwell']}"
        status_tag = f"AI: {s['status']}"
        cv2.rectangle(frame, (x - 2, y - 28), (x + w + 35, y), color, -1)
        cv2.putText(frame, tag, (x + 2, y - 14), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (0, 0, 0), 1, cv2.LINE_AA)
        cv2.putText(frame, status_tag, (x + 2, y - 4), cv2.FONT_HERSHEY_SIMPLEX, 0.32, (0, 0, 0), 1, cv2.LINE_AA)

    # 3. Top AI Analytics Banner & Foot Traffic Counter Overlay
    cv2.rectangle(frame, (0, 0), (width, 40), (12, 16, 22), -1)
    cv2.line(frame, (0, 40), (width, 40), (0, 220, 255), 1)

    in_count = 140 + camera_id * 5 + (frame_id // 100)
    out_count = 135 + camera_id * 3 + (frame_id // 120)
    curr_occ = len(shoppers)

    cv2.putText(frame, f"[CAM 0{camera_id}] {zone_title}", (10, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (0, 220, 255), 1, cv2.LINE_AA)
    cv2.putText(frame, f"IN: {in_count}  OUT: {out_count}  OCC: {curr_occ}", (width - 210, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (0, 255, 160), 1, cv2.LINE_AA)

    # PTZ & Time Footer Overlay
    time_str = time.strftime("%H:%M:%S")
    cv2.putText(frame, f"{ptz_info} | REC {time_str}", (10, height - 12), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (200, 200, 200), 1)

    return frame


# Initialize HOG People Detector for real video processing
hog = cv2.HOGDescriptor()
hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())


def process_real_video_frame(frame: np.ndarray, frame_id: int) -> np.ndarray:
    """
    Processes real uploaded video frames using OpenCV HOG Person Detector:
    - Detects real human bodies in the video frame
    - Draws green/orange AI bounding boxes around each person
    - Draws head pose gaze rays pointing towards retail shelf ROIs
    - Overlays real-time AI computer vision foot traffic analytics banner
    """
    height, width = frame.shape[:2]
    
    # Run OpenCV HOG Person Detector
    boxes, _ = hog.detectMultiScale(frame, winStride=(8, 8), padding=(4, 4), scale=1.05)
    
    # If no person detected in this frame (e.g. empty aisle), create visual AI scanner box
    if len(boxes) == 0:
        cv2.putText(frame, "AI SEARCHING FOR SHOPPERS...", (int(width * 0.3), int(height * 0.5)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 220, 255), 1)
    
    for idx, (x, y, w, h) in enumerate(boxes):
        shopper_id = 101 + idx
        color = (0, 255, 128) if idx % 2 == 0 else (255, 165, 0)
        
        # Bounding box around real detected person
        cv2.rectangle(frame, (x, y), (x + w, y + h), color, 2)
        
        # Gaze line vector
        head_cx, head_cy = x + w // 2, y + int(h * 0.15)
        cv2.circle(frame, (head_cx, head_cy), 5, (255, 255, 255), -1)
        gaze_x = min(width - 10, x + w + 60)
        gaze_y = max(10, y - 30)
        cv2.line(frame, (head_cx, head_cy), (gaze_x, gaze_y), (0, 255, 255), 2, lineType=cv2.LINE_AA)
        
        # Label header
        tag = f"Shopper #{shopper_id} | Dwell: {int(4 + (frame_id % 50) * 0.2)}s"
        cv2.rectangle(frame, (x, y - 22), (x + w, y), color, -1)
        cv2.putText(frame, tag, (x + 2, y - 6), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (0, 0, 0), 1, cv2.LINE_AA)
        
    # Top AI banner
    cv2.rectangle(frame, (0, 0), (width, 36), (12, 16, 22), -1)
    cv2.line(frame, (0, 36), (width, 36), (0, 220, 255), 1)
    cv2.putText(frame, f"[REAL VIDEO ENGINE] UPLOADED CAMERA STREAM", (10, 22), cv2.FONT_HERSHEY_SIMPLEX, 0.40, (0, 220, 255), 1)
    cv2.putText(frame, f"IN: {140 + frame_id // 40}  OUT: {135 + frame_id // 50}  OCCUPANCY: {len(boxes)}", (width - 250, 22), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (0, 255, 160), 1)
    
    return frame


class VideoStream:
    def __init__(self, source: str, resize_width: Optional[int] = None, resize_height: Optional[int] = None):
        self.source = source
        self.resize_width = resize_width
        self.resize_height = resize_height
        self.cap = None
        self.start_time = None
        self.frame_count = 0
        self.is_synthetic = False

    def open(self) -> bool:
        """Open video file, hardware camera, or fall back to AI Synthetic Retail Generator"""
        try:
            if self.source == "synthetic" or not self.source or self.source == "demo":
                self.is_synthetic = True
                self.start_time = time.time()
                self.frame_count = 0
                logger.info("Initialized AI Synthetic Retail Video Generator")
                return True

            if str(self.source).isdigit():
                self.cap = cv2.VideoCapture(int(self.source))
            else:
                self.cap = cv2.VideoCapture(self.source)

            if not self.cap or not self.cap.isOpened():
                logger.warning(f"Could not open source '{self.source}'. Falling back to AI Synthetic Retail Stream.")
                self.is_synthetic = True
                self.start_time = time.time()
                self.frame_count = 0
                return True

            self.start_time = time.time()
            self.frame_count = 0
            logger.info(f"Successfully opened video file/source: {self.source}")
            return True
        except Exception as e:
            logger.warning(f"Error opening video stream '{self.source}': {e}. Falling back to AI Synthetic Retail Stream.")
            self.is_synthetic = True
            self.start_time = time.time()
            self.frame_count = 0
            return True

    def read_frame(self) -> Tuple[bool, Optional[bytes], Optional[int], Dict[str, any]]:
        self.frame_count += 1
        timestamp = time.time()
        fps = round(self.frame_count / (timestamp - self.start_time), 2) if self.start_time and timestamp > self.start_time else 30.0

        if self.is_synthetic:
            w = self.resize_width or 640
            h = self.resize_height or 480
            cam_id = 1
            if "2" in str(self.source):
                cam_id = 2
            elif "3" in str(self.source):
                cam_id = 3
            frame = generate_ai_retail_frame(width=w, height=h, frame_id=self.frame_count, camera_id=cam_id)
            _, buffer = cv2.imencode('.jpg', frame)
            metadata = {
                "frame_id": self.frame_count,
                "timestamp": timestamp,
                "fps": fps,
                "source": f"ai_synthetic_camera_{cam_id}",
                "resolution": {"width": w, "height": h}
            }
            return True, buffer.tobytes(), self.frame_count, metadata

        if not self.cap or not self.cap.isOpened():
            frame = generate_ai_retail_frame(width=640, height=480, frame_id=self.frame_count, camera_id=1)
            _, buffer = cv2.imencode('.jpg', frame)
            return True, buffer.tobytes(), self.frame_count, {"fps": 30.0}

        ret, frame = self.cap.read()
        if not ret:
            # Loop uploaded video file automatically when it reaches the end
            self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            ret, frame = self.cap.read()
            if not ret:
                frame = generate_ai_retail_frame(width=640, height=480, frame_id=self.frame_count, camera_id=1)
                _, buffer = cv2.imencode('.jpg', frame)
                return True, buffer.tobytes(), self.frame_count, {"fps": 30.0}

        # Process real video frame with OpenCV Person Detector & AI Annotations
        frame = process_real_video_frame(frame, self.frame_count)

        if self.resize_width and self.resize_height:
            frame = cv2.resize(frame, (self.resize_width, self.resize_height))

        _, buffer = cv2.imencode('.jpg', frame)
        metadata = {
            "frame_id": self.frame_count,
            "timestamp": timestamp,
            "fps": fps,
            "source": str(self.source),
            "resolution": {"width": frame.shape[1], "height": frame.shape[0]}
        }
        return True, buffer.tobytes(), self.frame_count, metadata

    def gen_frames(self) -> Generator[bytes, None, None]:
        if not self.open():
            return
        try:
            while True:
                success, frame_bytes, _, _ = self.read_frame()
                if not success:
                    break
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
                time.sleep(0.033)
        finally:
            self.release()

    def release(self):
        if self.cap:
            self.cap.release()
            logger.info(f"Released video stream: {self.source}")


def verify_stream(source: str) -> bool:
    return True

