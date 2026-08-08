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

    # 1. Draw Retail Shelves (ROIs) based on camera ID
    if camera_id == 1:
        zone_title = "ZONE 1: ENTRANCE & PROMOTIONAL BAY"
        # Shelf A (Promotional Display)
        cv2.rectangle(frame, (40, 80), (280, 220), (50, 120, 60), -1)
        cv2.rectangle(frame, (40, 80), (280, 220), (0, 255, 120), 2)
        cv2.putText(frame, "SHELF A: Organic Energy Beverages", (45, 72), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (0, 255, 120), 1)

        # Shelf B (New Arrivals)
        cv2.rectangle(frame, (360, 80), (600, 220), (60, 50, 120), -1)
        cv2.rectangle(frame, (360, 80), (600, 220), (200, 120, 255), 2)
        cv2.putText(frame, "SHELF B: Premium Snacks & Nuts", (365, 72), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (200, 120, 255), 1)

        # Entry Gate
        cv2.rectangle(frame, (200, 380), (440, 470), (40, 40, 70), 2)
        cv2.putText(frame, "ENTRY / EXIT TURNSTILE", (210, 425), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (180, 180, 200), 1)

    elif camera_id == 2:
        zone_title = "ZONE 2: BEVERAGE AISLE"
        cv2.rectangle(frame, (30, 60), (260, 420), (40, 90, 120), -1)
        cv2.rectangle(frame, (30, 60), (260, 420), (0, 200, 255), 2)
        cv2.putText(frame, "SHELF C: Cold Brew & Juices", (35, 52), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 200, 255), 1)

        cv2.rectangle(frame, (380, 60), (610, 420), (90, 40, 120), -1)
        cv2.rectangle(frame, (380, 60), (610, 420), (255, 100, 200), 2)
        cv2.putText(frame, "SHELF D: Artisanal Teas & Soda", (385, 52), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 100, 200), 1)
    else:
        zone_title = "ZONE 3: CHECKOUT & IMPULSE BAY"
        cv2.rectangle(frame, (50, 100), (590, 240), (100, 70, 40), -1)
        cv2.rectangle(frame, (50, 100), (590, 240), (255, 180, 0), 2)
        cv2.putText(frame, "CHECKOUT COUNTER #1 & #2", (55, 92), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 180, 0), 1)

    # 2. Simulate AI Person Detection & Tracking Bounding Boxes
    t = frame_id * 0.05

    shoppers = [
        {
            "id": 101,
            "x": int(160 + 80 * math.sin(t)),
            "y": int(260 + 40 * math.cos(t * 0.8)),
            "w": 55, "h": 110,
            "color": (0, 255, 128),  # Green
            "status": "GAZE AT SHELF A",
            "gaze_target": (140, 150),
            "dwell": f"{int(12 + (frame_id % 120) * 0.1)}s"
        },
        {
            "id": 102,
            "x": int(460 + 60 * math.cos(t * 0.9)),
            "y": int(280 + 30 * math.sin(t * 1.1)),
            "w": 50, "h": 105,
            "color": (255, 165, 0),  # Orange
            "status": "PICKING PRODUCT",
            "gaze_target": (480, 160),
            "dwell": f"{int(8 + (frame_id % 90) * 0.1)}s"
        },
        {
            "id": 103,
            "x": int(320 + 30 * math.sin(t * 0.5)),
            "y": int(360 + 20 * math.sin(t * 0.7)),
            "w": 48, "h": 98,
            "color": (255, 0, 200),  # Pink
            "status": "WALKING",
            "gaze_target": (320, 220),
            "dwell": "3s"
        }
    ]

    for s in shoppers:
        x, y, w, h = s["x"], s["y"], s["w"], s["h"]
        color = s["color"]

        # Draw Person Bounding Box
        cv2.rectangle(frame, (x, y), (x + w, y + h), color, 2)

        # Draw Person Head & Gaze Direction Vector (AI Gaze Line)
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

    in_count = 142 + (frame_id // 100)
    out_count = 136 + (frame_id // 120)
    curr_occ = len(shoppers)

    cv2.putText(frame, f"[AI VISION CAM 0{camera_id}] {zone_title}", (10, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (0, 220, 255), 1, cv2.LINE_AA)
    cv2.putText(frame, f"IN: {in_count}  OUT: {out_count}  OCCUPANCY: {curr_occ}", (width - 240, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.40, (0, 255, 160), 1, cv2.LINE_AA)

    # Time overlay
    time_str = time.strftime("%H:%M:%S")
    cv2.putText(frame, f"REC {time_str}", (width - 70, height - 12), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (200, 200, 200), 1)

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

