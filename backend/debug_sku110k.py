"""
SKU110K Product Detection Model Diagnostic Script
Inspects the model file to determine what's wrong with product detection.
"""
import sys
import os

# Add the parent directory so imports work
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("=" * 70)
print("SKU110K MODEL DIAGNOSTIC REPORT")
print("=" * 70)

# 1. Check if model file exists and its size
model_path = "app/models/sku110k_best.pt"
print(f"\n[1] MODEL FILE CHECK")
print(f"    Path: {model_path}")
print(f"    Exists: {os.path.exists(model_path)}")
if os.path.exists(model_path):
    size_mb = os.path.getsize(model_path) / (1024 * 1024)
    print(f"    Size: {size_mb:.2f} MB")
else:
    print("    ERROR: Model file not found!")
    sys.exit(1)

# 2. Load model and inspect its internals
print(f"\n[2] MODEL LOADING")
try:
    from ultralytics import YOLO
    model = YOLO(model_path)
    print(f"    Loaded successfully: YES")
    print(f"    Model type: {type(model)}")
    print(f"    Task: {model.task}")
    print(f"    Model names (class labels): {model.names}")
    print(f"    Number of classes: {len(model.names)}")
except Exception as e:
    print(f"    LOAD ERROR: {e}")
    sys.exit(1)

# 3. Check model architecture info
print(f"\n[3] MODEL ARCHITECTURE")
try:
    if hasattr(model, 'model'):
        m = model.model
        print(f"    Model class: {m.__class__.__name__}")
        if hasattr(m, 'yaml'):
            print(f"    YAML config: {m.yaml}")
        if hasattr(m, 'args'):
            print(f"    Training args: {dict(m.args) if hasattr(m.args, '__iter__') else m.args}")
except Exception as e:
    print(f"    Could not inspect architecture: {e}")

# 4. Test inference on a synthetic image
print(f"\n[4] INFERENCE TEST (Synthetic 640x480 image)")
try:
    import numpy as np
    test_img = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)

    results = model(test_img, verbose=True, conf=0.01)  # Very low conf to catch anything
    print(f"    Results type: {type(results)}")
    print(f"    Results length: {len(results)}")

    if results and len(results) > 0:
        r = results[0]
        print(f"    Boxes: {r.boxes}")
        if r.boxes is not None:
            print(f"    Number of detections: {len(r.boxes)}")
            if len(r.boxes) > 0:
                print(f"    Confidence scores: {r.boxes.conf.cpu().tolist()}")
                print(f"    Class IDs: {r.boxes.cls.int().cpu().tolist()}")
                print(f"    First box coords: {r.boxes.xyxy[0].cpu().tolist()}")
            else:
                print(f"    *** NO DETECTIONS on synthetic image (expected with random noise)")
        else:
            print(f"    Boxes is None - no detections")
except Exception as e:
    print(f"    INFERENCE ERROR: {e}")
    import traceback
    traceback.print_exc()

# 5. Test inference on a real video frame (if video exists)
print(f"\n[5] INFERENCE TEST (Real video frame)")
video_dirs = ["uploads", "processed"]
test_frame = None

for vdir in video_dirs:
    if os.path.isdir(vdir):
        for f in os.listdir(vdir):
            if f.endswith(".mp4") and not f.endswith("_temp.mp4"):
                video_path = os.path.join(vdir, f)
                print(f"    Testing with video: {video_path}")
                import cv2
                cap = cv2.VideoCapture(video_path)
                ret, test_frame = cap.read()
                cap.release()
                if ret and test_frame is not None:
                    print(f"    Frame shape: {test_frame.shape}")
                    break
        if test_frame is not None:
            break

if test_frame is not None:
    try:
        # Test with different confidence thresholds
        for conf_thresh in [0.01, 0.1, 0.25, 0.5]:
            results = model(test_frame, verbose=False, conf=conf_thresh)
            n_det = len(results[0].boxes) if results and results[0].boxes is not None else 0
            confs = results[0].boxes.conf.cpu().tolist() if n_det > 0 else []
            top5_confs = sorted(confs, reverse=True)[:5]
            print(f"    conf={conf_thresh}: {n_det} detections, top-5 confs: {top5_confs}")
    except Exception as e:
        print(f"    REAL FRAME INFERENCE ERROR: {e}")
        import traceback
        traceback.print_exc()
else:
    print(f"    No video files found in uploads/ or processed/ - skipping real frame test")

# 6. Check person model for comparison
print(f"\n[6] PERSON MODEL COMPARISON")
try:
    person_model = YOLO("yolov8n.pt")
    print(f"    Person model names: {person_model.names}")
    print(f"    Person model task: {person_model.task}")
    print(f"    Person model classes count: {len(person_model.names)}")
except Exception as e:
    print(f"    Person model error: {e}")

print(f"\n{'=' * 70}")
print("DIAGNOSTIC COMPLETE")
print("=" * 70)
