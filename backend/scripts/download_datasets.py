import os
import urllib.request
import logging
import cv2
import numpy as np

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("download_datasets")

# Root datasets directory paths
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DATASETS_DIR = os.path.join(BASE_DIR, "datasets")
WEIGHTS_DIR = os.path.join(DATASETS_DIR, "weights")
VIDEOS_DIR = os.path.join(DATASETS_DIR, "videos", "sample")
COCO_DIR = os.path.join(DATASETS_DIR, "COCO")
SKU110K_DIR = os.path.join(DATASETS_DIR, "SKU110K")
RETAIL_CHECKOUT_DIR = os.path.join(DATASETS_DIR, "RetailCheckout")
RETAIL_TRAFFIC_DIR = os.path.join(DATASETS_DIR, "RetailTraffic")
ANNOTATIONS_DIR = os.path.join(DATASETS_DIR, "annotations")

def ensure_directories():
    dirs = [
        DATASETS_DIR, WEIGHTS_DIR, VIDEOS_DIR, 
        COCO_DIR, SKU110K_DIR, RETAIL_CHECKOUT_DIR, 
        RETAIL_TRAFFIC_DIR, ANNOTATIONS_DIR
    ]
    for d in dirs:
        if not os.path.exists(d):
            os.makedirs(d)
            logger.info(f"Created folder: {d}")

def download_yolo_weights():
    weights_path = os.path.join(WEIGHTS_DIR, "yolov8n.pt")
    if os.path.exists(weights_path):
        logger.info("YOLOv8 weights already exist in datasets/weights/.")
        return

    url = "https://github.com/ultralytics/assets/releases/download/v8.1.0/yolov8n.pt"
    logger.info(f"Downloading YOLOv8 weights from {url}...")
    try:
        urllib.request.urlretrieve(url, weights_path)
        logger.info("YOLOv8 weights downloaded successfully.")
    except Exception as e:
        logger.warning(f"Failed to download YOLOv8 weights: {e}. Ingestion will fall back to simulated coordinates tracker.")


def generate_synthetic_retail_video(filename: str, num_frames=300):
    video_path = os.path.join(VIDEOS_DIR, filename)
    if os.path.exists(video_path):
        logger.info(f"Video {filename} already exists in datasets/videos/sample/.")
        return

    logger.info(f"Generating synthetic retail video: {filename}...")
    try:
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(video_path, fourcc, 30.0, (640, 480))
        
        shoppers = [
            {"x": 100, "y": 400, "vx": 1.5, "vy": -2.0, "color": (0, 0, 255)},
            {"x": 300, "y": 450, "vx": -0.5, "vy": -1.5, "color": (0, 255, 0)},
            {"x": 50, "y": 100, "vx": 2.0, "vy": 0.8, "color": (255, 0, 0)}
        ]
        
        for f in range(num_frames):
            frame = np.zeros((480, 640, 3), dtype=np.uint8)
            # Draw features
            cv2.rectangle(frame, (50, 50), (250, 350), (100, 100, 100), 2)
            cv2.putText(frame, "Shelf A", (60, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (100, 100, 100), 1)
            
            cv2.rectangle(frame, (400, 100), (600, 400), (80, 80, 80), 2)
            cv2.putText(frame, "Checkout Counter", (410, 130), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (80, 80, 80), 1)
            
            # Draw moving circles
            for s in shoppers:
                s["x"] += s["vx"]
                s["y"] += s["vy"]
                if s["x"] < 0 or s["x"] > 640: s["vx"] *= -1
                if s["y"] < 0 or s["y"] > 480: s["vy"] *= -1
                cv2.circle(frame, (int(s["x"]), int(s["y"])), 15, s["color"], -1)
                
            out.write(frame)
            
        out.release()
        logger.info(f"Synthetic video saved to {video_path}")
    except Exception as e:
        logger.error(f"Failed to generate synthetic video: {e}")


def main():
    ensure_directories()
    download_yolo_weights()
    generate_synthetic_retail_video("sim_entrance.mp4")
    generate_synthetic_retail_video("sim_aisle_left.mp4")
    generate_synthetic_retail_video("sim_aisle_right.mp4")
    generate_synthetic_retail_video("sim_checkout.mp4")
    logger.info("Dataset directories and sample assets setup complete.")

if __name__ == "__main__":
    main()
