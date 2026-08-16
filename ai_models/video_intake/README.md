# Video Intake Service

Connects to a camera (webcam, RTSP/IP camera, or a plain video file) and
emits a downsampled frame stream at a target FPS (default 5), so the
detection/tracking pipeline downstream doesn't decode and process every
raw frame the source produces.

## Why this matters

A typical store camera runs at 15-30fps. Running YOLOv8 + tracking +
gaze estimation on every single frame is both unnecessary (people don't
move fast enough in a store aisle for 30fps to add real signal over 5fps)
and expensive in memory/CPU. This module does the downsampling *before*
any model sees a frame, and — importantly — only fully decodes the
frames it's actually going to keep (`cv2.VideoCapture.grab()` for
discarded frames vs `.retrieve()` for kept ones), so the saving is real
CPU/memory, not just "the model runs less often."

## Usage

```bash
pip install -r requirements.txt

# From a video file
python intake.py --source sample_data/vtest.avi --target-fps 5 --output out.mp4

# From a webcam
python intake.py --source 0 --target-fps 5

# From an RTSP camera
python intake.py --source rtsp://user:pass@192.168.1.50:554/stream1 --target-fps 5

# Also downscale resolution to save more memory
python intake.py --source 0 --target-fps 5 --resize-width 640
```

## Wiring in a detector

```python
from intake import IntakeConfig, VideoIntake

def on_frame(frame, index, timestamp):
    detections = your_yolo_model(frame)
    # POST to the backend, e.g.:
    # requests.post(f"{API_BASE}/tracking/batch", json=[...], headers=auth_headers)

intake = VideoIntake(IntakeConfig(source="rtsp://...", target_fps=5))
intake.run(on_frame=on_frame)
```

## Sample data

`sample_data/vtest.avi` is OpenCV's own public pedestrian-tracking sample
clip (10fps, 795 frames, 768x576), pulled from the `opencv/opencv` GitHub
repo. It's a generic pedestrian scene, not store footage specifically —
this sandbox can't reach retail-specific video sources — but it exercises
the exact same code path (person-sized moving subjects, real compression
artifacts) that a real store camera feed would.

Verified: 10fps source → 5fps output halves the frame count exactly
(795 → 398 frames), and the output file plays back with `CAP_PROP_FPS == 5.0`.

## Tests

```bash
python -m pytest test_intake.py -v
```
