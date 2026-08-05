import threading
import time
import cv2

from camera_stream import get_video_path
from ai_detector import detect_people
from heatmap import heatmaps
from frame_buffer import (
    set_frame,
    set_heatmap,
)

# ==========================================================
# Worker Object
# ==========================================================

class CameraWorker:

    def __init__(self, camera_id):

        self.camera_id = camera_id

        self.running = False

        self.thread = None

    # ======================================================
    # Main Worker Loop
    # ======================================================

    def run(self):

        video_path = get_video_path(self.camera_id)

        cap = cv2.VideoCapture(video_path)

        if not cap.isOpened():

            print(f"Cannot open Camera {self.camera_id}")

            return

        self.running = True

        print(f"Camera {self.camera_id} Started")

        while self.running:

            success, frame = cap.read()

            if not success:

                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)

                continue

            frame = cv2.resize(
                frame,
                (640, 480)
            )

            # ==========================================
            # AI Detection
            # ==========================================

            processed = detect_people(
                self.camera_id,
                frame
            )

            # ==========================================
            # Save Latest Camera Frame
            # ==========================================

            set_frame(
                self.camera_id,
                processed
            )

            # ==========================================
            # Save Latest Heatmap
            # ==========================================

            heat = heatmaps[
                self.camera_id
            ].heatmap_only()

            set_heatmap(
                self.camera_id,
                heat
            )

            time.sleep(0.01)

        cap.release()

    # ======================================================
    # Start Worker
    # ======================================================

    def start(self):

        self.thread = threading.Thread(
            target=self.run,
            daemon=True
        )

        self.thread.start()

    # ======================================================
    # Stop Worker
    # ======================================================

    def stop(self):

        self.running = False


# ==========================================================
# Create Workers
# ==========================================================

workers = {

    1: CameraWorker(1),

    2: CameraWorker(2),

    3: CameraWorker(3),

    4: CameraWorker(4),

}


# ==========================================================
# Start All Cameras
# ==========================================================

def start_camera_workers():

    print()

    print("=" * 60)

    print("Starting Camera Workers...")

    print("=" * 60)

    print()

    for worker in workers.values():

        worker.start()

    print()

    print("All Camera Workers Started")

    print()