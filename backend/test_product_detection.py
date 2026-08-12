"""Quick test: SKU110K with the new tuning parameters on a real video frame."""
import os, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ultralytics import YOLO
import cv2

# Load model
model = YOLO("app/models/sku110k_best.pt")
print("Model Classes:", model.names)
print("Model Task:", model.task)

# Load a real video frame
video_path = None
for vdir in ["uploads", "processed"]:
    if os.path.isdir(vdir):
        for f in os.listdir(vdir):
            if f.endswith(".mp4") and not f.endswith("_temp.mp4"):
                video_path = os.path.join(vdir, f)
                break
    if video_path:
        break

if not video_path:
    print("ERROR: No video found in uploads/ or processed/")
    sys.exit(1)

print(f"\nVideo: {video_path}")
cap = cv2.VideoCapture(video_path)
ret, frame = cap.read()
cap.release()
print(f"Frame shape: {frame.shape}")

# Test with our tuned parameters
CONF = 0.15
IMGSZ = 640
MIN_AREA = 400

print(f"\n{'='*60}")
print(f"RUNNING INFERENCE: conf={CONF}, imgsz={IMGSZ}")
print(f"{'='*60}")

start = time.time()
results = model(frame, verbose=False, conf=CONF, imgsz=IMGSZ)
elapsed = time.time() - start

print(f"Inference time: {elapsed*1000:.1f}ms")

if results and len(results) > 0 and results[0].boxes is not None:
    boxes = results[0].boxes
    print(f"Raw detections: {len(boxes)}")
    
    # Filter by area
    valid = 0
    for box in boxes:
        xyxy = box.xyxy[0].cpu().numpy()
        x1, y1, x2, y2 = map(int, xyxy)
        area = (x2-x1) * (y2-y1)
        conf = float(box.conf[0])
        cls = int(box.cls[0])
        if area >= MIN_AREA:
            valid += 1
            if valid <= 10:  # Print first 10
                print(f"  [{valid}] Class: {cls} ({model.names[cls]}), Conf: {conf:.3f}, Box: ({x1},{y1})-({x2},{y2}), Area: {area}px")
    
    print(f"\nValid detections (area>={MIN_AREA}): {valid}")
    
    # Save annotated frame for visual verification
    annotated = frame.copy()
    for box in boxes:
        xyxy = box.xyxy[0].cpu().numpy()
        x1, y1, x2, y2 = map(int, xyxy)
        area = (x2-x1) * (y2-y1)
        if area >= MIN_AREA:
            conf = float(box.conf[0])
            cv2.rectangle(annotated, (x1,y1), (x2,y2), (0,255,255), 2)
            cv2.putText(annotated, f"Product {conf:.2f}", (x1, max(10,y1-8)), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0,255,255), 1)
    
    out_path = "product_detection_test.jpg"
    cv2.imwrite(out_path, annotated)
    print(f"\nSaved annotated test frame to: {out_path}")
else:
    print("NO DETECTIONS at all!")
