import cv2
import time
import torch
from ultralytics import YOLO

for model_name, imgsz in [('yolov8n.pt', 480), ('yolov8n.pt', 640), ('yolov8s.pt', 480)]:
    try:
        model = YOLO(model_name)
        model.to('cpu')
        
        cap = cv2.VideoCapture('frontend/public/videos/store1.mp4')
        times = []
        person_counts = []
        for i in range(15):
            ret, frame = cap.read()
            if not ret: break
            t0 = time.perf_counter()
            res = model.predict(source=frame, conf=0.25, classes=[0], imgsz=imgsz, verbose=False)
            dt = (time.perf_counter() - t0) * 1000
            if i > 2:  # skip warmup
                times.append(dt)
                boxes = res[0].boxes
                person_counts.append(len(boxes) if boxes is not None else 0)
        cap.release()
        avg_ms = sum(times) / len(times) if times else 0
        avg_fps = 1000.0 / avg_ms if avg_ms else 0
        print(f"Model {model_name} (imgsz={imgsz}): Avg {avg_ms:.1f}ms ({avg_fps:.1f} FPS), Avg people: {sum(person_counts)/len(person_counts):.1f}")
    except Exception as e:
        print(f"Error {model_name}: {e}")
