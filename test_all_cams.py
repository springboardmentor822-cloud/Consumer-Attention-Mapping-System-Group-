import cv2
import time
import torch
import glob
from ultralytics import YOLO
from ultralytics.trackers.byte_tracker import BYTETracker
from types import SimpleNamespace

model = YOLO('yolov8n.pt')
model.to('cpu')

videos = [
    ('CAM-01', 'frontend/public/videos/store1.mp4'),
    ('CAM-02', 'frontend/public/videos/aisle1.mp4'),
    ('CAM-03', 'frontend/public/videos/checkout1.mp4'),
    ('CAM-04', 'frontend/public/videos/checkout2.mp4'),
]

for cam_id, vpath in videos:
    cap = cv2.VideoCapture(vpath)
    if not cap.isOpened():
        print(f"[{cam_id}] Cannot open {vpath}")
        continue
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    
    args = SimpleNamespace(
        track_high_thresh=0.35,
        track_low_thresh=0.15,
        new_track_thresh=0.45,
        track_buffer=90,
        match_thresh=0.70,
        fuse_score=True,
        fps=int(fps),
    )
    tracker = BYTETracker(args=args)
    
    track_counts = []
    for f_idx in range(30):
        ret, frame = cap.read()
        if not ret: break
        
        results = model.predict(source=frame, conf=0.10, classes=[0], imgsz=640, verbose=False)
        boxes = results[0].boxes
        
        valid_boxes = []
        raw_info = []
        if boxes is not None and len(boxes) > 0:
            for i in range(len(boxes)):
                conf = float(boxes.conf[i].item())
                x1, y1, x2, y2 = boxes.xyxy[i].tolist()
                bw = x2 - x1
                bh = y2 - y1
                aspect = bh / max(bw, 1e-3)
                raw_info.append(f"[w={bw:.1f}, h={bh:.1f}, aspect={aspect:.2f}, conf={conf:.2f}]")
                # relaxed criteria
                if bw >= 15 and bh >= 15 and 0.5 <= aspect <= 6.0:
                    valid_boxes.append(i)
            
            if valid_boxes:
                keep = torch.tensor(valid_boxes, dtype=torch.long, device=boxes.data.device)
                raw_tracks = tracker.update(boxes[keep])
            else:
                raw_tracks = tracker.update(boxes[torch.tensor([], dtype=torch.long)])
        else:
            raw_tracks = []
            
        t_ids = [int(t[4]) for t in raw_tracks] if len(raw_tracks) > 0 else []
        track_counts.append(len(t_ids))
        if f_idx in [0, 10, 20, 29]:
            print(f"[{cam_id}] Frame {f_idx:02d}: Raw detections: {raw_info}")
            print(f"[{cam_id}] Frame {f_idx:02d}: Valid detections: {len(valid_boxes)} -> Active Tracks: {t_ids}")
            
    cap.release()
    avg_trk = sum(track_counts) / len(track_counts) if track_counts else 0
    print(f"[{cam_id}] Average tracked people: {avg_trk:.1f}\n")
