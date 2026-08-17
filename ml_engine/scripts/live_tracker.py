import os
import sys
import threading
import cv2
import time
import requests
import base64
import concurrent.futures
from datetime import datetime, timezone
from collections import deque, defaultdict
from ultralytics import YOLO

import uuid

# Configuration
API_INGEST_URL = os.getenv("API_INGEST_URL", "http://localhost:8000/api/stream/ingest").strip()
API_ZONES_URL = os.getenv("API_ZONES_URL", "http://localhost:8000/api/stream/zones").strip()
STORE_ID_ENV = os.getenv("CAMS_STORE_ID", "").strip()
STORE_ID = STORE_ID_ENV if STORE_ID_ENV and not STORE_ID_ENV.startswith("%") else "00000000-0000-0000-0000-000000000000"

CAMERA_ID_ENV = os.getenv("CAMS_CAMERA_ID", "").strip()
CAMERA_ID = CAMERA_ID_ENV if CAMERA_ID_ENV and not CAMERA_ID_ENV.startswith("%") else "CAM-01 — Live Webcam"

try:
    uuid.UUID(STORE_ID)
except ValueError:
    print(f"ERROR: Invalid CAMS_STORE_ID: '{STORE_ID}'")
    sys.exit(1)

# Camera source: default to webcam index 0, configurable via env
def get_camera_source():
    raw = os.getenv("CAMERA_SOURCE", "0").strip()
    # Try to parse as integer (webcam index)
    try:
        return int(raw)
    except ValueError:
        # It's a file path or URL
        return raw

def track_video(video_source, store_id=STORE_ID, camera_id=CAMERA_ID):
    source_label = f"Webcam {video_source}" if isinstance(video_source, int) else video_source
    print("=" * 60)
    print("  CAMS — Zero-Latency Live Tracking Engine")
    print("=" * 60)
    print(f"  Camera source : {source_label}")
    print(f"  Store ID      : {store_id}")
    
    # ---------------------------------------------------------
    # CONFIGURATION
    # ---------------------------------------------------------
    FRAME_SKIP = int(os.getenv("INFERENCE_EVERY_N_FRAMES", "1"))
    MAX_WIDTH = 640
    IMGSZ = int(os.getenv("INFERENCE_IMGSZ", "416"))
    JPEG_QUALITY = int(os.getenv("JPEG_QUALITY", "55"))
    
    # Fetch Zones from backend
    zones = []
    try:
        session = requests.Session()
        resp = session.get(f"{API_ZONES_URL}/{store_id}", timeout=2)
        if resp.status_code == 200:
            zones = resp.json()
            print(f"  Loaded {len(zones)} zones from backend.")
    except Exception as e:
        print(f"  Warning: Could not fetch zones from backend: {e}")

    print(f"\nLoading YOLO model (imgsz={IMGSZ}, classes=[0])...")
    model = YOLO('yolov8n.pt')

    # ---------------------------------------------------------
    # 1. CAPTURE THREAD (Latest-frame wins)
    # ---------------------------------------------------------
    class CameraCapture:
        def __init__(self, src):
            self.cap = cv2.VideoCapture(src)
            # Try to minimize internal buffer for webcam
            if isinstance(src, int):
                self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            self.ret, self.frame = self.cap.read()
            self.running = True
            self.thread = threading.Thread(target=self.update, daemon=True)
            self.thread.start()

        def update(self):
            while self.running:
                if self.cap.isOpened():
                    ret, frame = self.cap.read()
                    if ret:
                        self.ret, self.frame = ret, frame
                    else:
                        if not isinstance(video_source, int):
                            self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                        else:
                            time.sleep(0.1)
                else:
                    time.sleep(0.1)

        def read(self):
            return self.ret, self.frame
            
        def release(self):
            self.running = False
            self.thread.join(timeout=1.0)
            self.cap.release()

    print(f"Opening camera source: {source_label}...")
    cam = CameraCapture(video_source)
    if not cam.cap.isOpened():
        print("ERROR: Could not open camera source.")
        return

    # ---------------------------------------------------------
    # 2. NETWORK SENDER (Background, Latest-frame wins)
    # ---------------------------------------------------------
    class NetworkSender:
        def __init__(self):
            self.running = True
            self.session = requests.Session()
            self.latest_frame_payload = None
            self.latest_coords_payload = None
            self.frame_lock = threading.Lock()
            self.coords_lock = threading.Lock()
            self.thread = threading.Thread(target=self.run, daemon=True)
            self.thread.start()

        def push_frame(self, payload):
            with self.frame_lock:
                self.latest_frame_payload = payload

        def push_coords(self, payload):
            with self.coords_lock:
                self.latest_coords_payload = payload

        def run(self):
            while self.running:
                f_payload = None
                c_payload = None
                
                with self.frame_lock:
                    if self.latest_frame_payload:
                        f_payload = self.latest_frame_payload
                        self.latest_frame_payload = None
                        
                with self.coords_lock:
                    if self.latest_coords_payload:
                        c_payload = self.latest_coords_payload
                        self.latest_coords_payload = None
                        
                if c_payload:
                    try:
                        self.session.post(API_INGEST_URL, json=c_payload, timeout=0.5)
                    except Exception: pass
                    
                if f_payload:
                    try:
                        self.session.post("http://localhost:8000/api/stream/frame", json=f_payload, timeout=0.5)
                    except Exception: pass
                    
                if not f_payload and not c_payload:
                    time.sleep(0.01)

    sender = NetworkSender()

    print("Streaming processed frames... Press Ctrl+C to stop.\n")

    trajectories = defaultdict(lambda: deque(maxlen=30))
    last_positions = {}
    velocities = {}
    active_confidences = {}
    last_track_ids = []
    
    frame_count = 0
    total_latency_accum = 0.0

    while True:
        loop_start = time.perf_counter()
        
        # 1. Capture
        t0 = time.perf_counter()
        ret, raw_frame = cam.read()
        if not ret or raw_frame is None:
            time.sleep(0.01)
            continue
        # Use copy so the capture thread doesn't overwrite it while we process
        frame = raw_frame.copy()
        t_capture = (time.perf_counter() - t0) * 1000

        frame_count += 1
        current_time = datetime.now(timezone.utc).isoformat()
        
        h, w = frame.shape[:2]
        if w > MAX_WIDTH:
            scale = MAX_WIDTH / w
            frame = cv2.resize(frame, (MAX_WIDTH, int(h * scale)))
            
        annotated_frame = frame.copy()
        run_inference = (frame_count % FRAME_SKIP == 0)
        
        batch_payload = []
        active_count = len(last_track_ids)
        
        # 2. Inference
        t1 = time.perf_counter()
        if run_inference:
            # CPU Safe explicitly: half=False
            results = model.track(frame, tracker="bytetrack.yaml", persist=True, classes=[0], imgsz=IMGSZ, half=False, verbose=False)
            result = results[0]
            boxes = result.boxes
            
            current_track_ids = set()
            new_last_positions = {}
            
            if boxes is not None and boxes.id is not None:
                track_ids = boxes.id.int().cpu().tolist()
                coordinates = boxes.xywh.cpu().tolist()
                confidences = boxes.conf.cpu().tolist()
                active_count = len(track_ids)
                
                for tid, (x, y, w_box, h_box), conf in zip(track_ids, coordinates, confidences):
                    if conf < 0.4: continue # Filter low confidence
                    
                    current_track_ids.add(tid)
                    if tid in last_positions:
                        old_x, old_y, _, _ = last_positions[tid]
                        velocities[tid] = ((x - old_x) / FRAME_SKIP, (y - old_y) / FRAME_SKIP)
                    else:
                        velocities[tid] = (0.0, 0.0)
                        
                    new_last_positions[tid] = (x, y, w_box, h_box)
                    active_confidences[tid] = conf
            
            last_positions = new_last_positions
            last_track_ids = list(current_track_ids)
            
            stale_ids = [tid for tid in list(trajectories.keys()) if tid not in current_track_ids]
            for tid in stale_ids:
                del trajectories[tid]
        else:
            for tid in last_track_ids:
                if tid in last_positions and tid in velocities:
                    x, y, w_box, h_box = last_positions[tid]
                    vx, vy = velocities[tid]
                    last_positions[tid] = (x + vx, y + vy, w_box, h_box)
        t_inference = (time.perf_counter() - t1) * 1000

        # 3. Annotation
        t2 = time.perf_counter()
        for tid in last_track_ids:
            if tid not in last_positions: continue
            
            x_center, y_center, w_box, h_box = last_positions[tid]
            conf = active_confidences.get(tid, 0.0)
            
            if run_inference:
                trajectories[tid].append((int(x_center), int(y_center)))
                
            pts = list(trajectories[tid])
            if len(pts) > 1:
                for i in range(1, len(pts)):
                    cv2.line(annotated_frame, pts[i-1], pts[i], (0, 255, 0), 2)
                    
            x1 = int(x_center - w_box / 2)
            y1 = int(y_center - h_box / 2)
            x2 = int(x_center + w_box / 2)
            y2 = int(y_center + h_box / 2)
            cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), (255, 0, 0), 2)
            cv2.putText(annotated_frame, f"#{tid} ({conf:.2f})", (x1, max(y1-10, 15)), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 255, 255), 1)
                       
            if run_inference:
                orig_h, orig_w = frame.shape[:2]
                batch_payload.append({
                    "store_id": store_id,
                    "camera_id": camera_id,
                    "shopper_id": f"#{tid}",
                    "x": (float(x_center) / float(orig_w)) * 100.0,
                    "y": (float(y_center) / float(orig_h)) * 100.0,
                    "timestamp": current_time
                })
        t_annotate = (time.perf_counter() - t2) * 1000

        # 4. JPEG Encode
        t3 = time.perf_counter()
        _, buffer = cv2.imencode('.jpg', annotated_frame, [cv2.IMWRITE_JPEG_QUALITY, JPEG_QUALITY])
        frame_base64 = base64.b64encode(buffer).decode('utf-8')
        t_jpeg = (time.perf_counter() - t3) * 1000

        # 5. Network Send (non-blocking)
        t4 = time.perf_counter()
        if batch_payload and run_inference:
            sender.push_coords(batch_payload)
            
        frame_payload = {
            "store_id": store_id,
            "camera_id": camera_id,
            "frame_base64": f"data:image/jpeg;base64,{frame_base64}",
            "timestamp": current_time
        }
        sender.push_frame(frame_payload)
        t_network = (time.perf_counter() - t4) * 1000
        
        loop_ms = (time.perf_counter() - loop_start) * 1000
        total_latency_accum += loop_ms
        
        if frame_count % 30 == 0:
            avg_ms = total_latency_accum / 30.0
            print(f"\n--- Profiling Frame {frame_count} ---")
            print(f"Capture:   {t_capture:.1f} ms")
            print(f"Inference: {t_inference:.1f} ms (imgsz={IMGSZ}, skip={FRAME_SKIP})")
            print(f"Annotate:  {t_annotate:.1f} ms")
            print(f"JPEG Enc:  {t_jpeg:.1f} ms (q={JPEG_QUALITY}, size={len(frame_base64)/1024:.1f}kb)")
            print(f"Network:   {t_network:.1f} ms (push to thread)")
            print(f"Total loop:{avg_ms:.1f} ms")
            print(f"Effective: {1000.0/avg_ms:.1f} FPS | Active Shoppers: {active_count}")
            total_latency_accum = 0.0

    cam.release()
    sender.running = False
    print("Tracking pipeline finished.")

if __name__ == "__main__":
    try:
        source = get_camera_source()
        cam_id = os.getenv("CAMS_CAMERA_ID", CAMERA_ID)
        
        # Try to fetch the demo store ID from backend
        try:
            resp = requests.get("http://localhost:8000/api/stores", timeout=3)
            if resp.status_code == 200:
                stores = resp.json()
                demo_store = next((s for s in stores if s['store_name'] == 'CAMS SmartMart — Demo Store'), None)
                if demo_store:
                    STORE_ID_RESOLVED = demo_store['id']
                    print(f"Bound to demo store: {STORE_ID_RESOLVED}")
                else:
                    STORE_ID_RESOLVED = STORE_ID
            else:
                STORE_ID_RESOLVED = STORE_ID
        except Exception:
            STORE_ID_RESOLVED = STORE_ID

        track_video(video_source=source, store_id=STORE_ID_RESOLVED, camera_id=cam_id)
    except KeyboardInterrupt:
        print("\nTracking stopped by user.")
    except Exception as e:
        import traceback
        print("\nCRITICAL ERROR IN LIVE TRACKER:")
        traceback.print_exc()
        input("Press Enter to exit...")
