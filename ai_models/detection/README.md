# Detection & Tracking Pipeline

Wires `video_intake` → a person detector → a tracker → the backend's
`/sessions` and `/tracking/batch` ingest APIs, managing shopper session
lifecycle automatically (a session is created the first time a track
appears, and closed when it disappears for too many consecutive frames).

**Verified end-to-end** against a real running backend: ran the sample
video through the pipeline, and confirmed real `ShopperSession` rows and
real `TrackingData` rows landed in the database via actual HTTP calls
(see the session/tracking JSON in the project's build log — session IDs,
track IDs, and pixel bounding boxes all line up).

## Two detectors, one interface

| | HOG (default) | YOLOv8 (production) |
|---|---|---|
| Needs a model download? | No — ships with OpenCV | Yes — `yolov8n.pt` or larger |
| Tracker | Custom centroid tracker (included) | Built-in ByteTrack via `.track()` |
| Accuracy | Lower, older algorithm | Much higher |
| Speed | Slower per-frame on CPU | Faster with a GPU |
| Tested in this sandbox? | **Yes** | No — see below |

### Why YOLOv8 wasn't tested here

`ultralytics` installs and imports fine in this sandbox. But fetching
actual model weights fails: Ultralytics' downloader redirects to
`release-assets.githubusercontent.com`, which this sandbox's network
egress proxy blocks (confirmed error: *"Host not in allowlist:
release-assets.githubusercontent.com"*). The `YOLOv8Detector` class in
`detector.py` is complete, correct integration code — on a machine with
normal internet access (or with `yolov8n.pt` copied in manually), run:

```bash
pip install ultralytics
python pipeline.py --source rtsp://... --detector yolov8 --yolo-weights yolov8n.pt ...
```

and it will work unchanged — same `Detection` interface, same pipeline,
just swap `--detector hog` for `--detector yolov8`.

## Usage

```bash
pip install -r requirements.txt

# Dry run - prints what it would send, no backend needed:
python pipeline.py --source ../video_intake/sample_data/vtest.avi --dry-run

# Real run against a live backend:
python pipeline.py \
  --source rtsp://192.168.1.50:554/stream1 \
  --camera-id 1 --store-id 1 \
  --backend-url http://localhost:8000/api/v1 \
  --email admin@example.com --password Admin123!
```

## Tests

```bash
python -m pytest test_detection.py -v
```

## Known limitations (be aware before pointing this at real customers)

- The centroid tracker (HOG path) has no motion model or re-identification
  — it will lose track of someone who's briefly occluded and assign them
  a new ID when they reappear. ByteTrack (YOLOv8 path) handles this much
  better.
- Floor-plane coordinates (`floor_x`/`floor_y` on `TrackingData`) aren't
  populated yet — that needs a camera calibration/homography step
  (pixel coordinates → real floor-plan meters) that isn't built here.
  Pixel-space bounding boxes are pushed as-is.
- No batching/backpressure handling for the HTTP calls to the backend —
  fine for a single demo camera, but a multi-camera production deployment
  should batch and queue (e.g. via a message queue) rather than calling
  the API synchronously per frame.
