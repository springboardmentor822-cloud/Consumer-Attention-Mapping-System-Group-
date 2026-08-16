# Camera Calibration (Pixel → Floor-Plane Coordinates)

Converts a detection's pixel bounding box into real floor-plan
coordinates (meters), using a homography computed from a handful of
known point correspondences. This is what makes traffic heatmaps, zone
occupancy, and "how close is this shopper to shelf X" geometrically
meaningful instead of just raw pixel positions.

**Verified end-to-end** against a live backend: calibrated a synthetic
10m×8m camera view, ran the detection pipeline against it, and confirmed
real `floor_x`/`floor_y` values (in meters, matching the calibrated
coordinate space) landed on `TrackingData` rows in the database.

## Why a homography and not a simpler scale/offset

A camera's view of the floor is a perspective projection, not an
orthographic one — points further from the camera are compressed more
than points closer to it. A straight line in pixel-space is not a
straight line in real-world distance. A 3x3 projective homography
corrects for this, as long as every point you're mapping lies on a
single flat plane (the floor). That's why we use each detection's
**foot point** (bottom-center of the bounding box) for the conversion,
not the box center — a person's head is not on the floor plane, so
projecting it through a floor homography gives a meaningless answer.

## Building a calibration for a real camera

1. Grab a reference still frame:
   ```bash
   python extract_frame.py --source rtsp://192.168.1.50:554/stream1 --output reference.jpg
   ```
2. Open `reference.jpg` in any image viewer. Pick at least 4 points whose
   real-world floor position you can measure — tile corners, marked tape,
   shelf base corners — and note their pixel coordinates (most image
   viewers show cursor position) plus their measured (x, y) in meters
   relative to a fixed origin for the store (e.g. the entrance).
3. Write those into a `points.json` file (see `calibrate.py`'s docstring
   for the exact format).
4. Compute and save the calibration:
   ```bash
   python calibrate.py --points points.json \
     --backend-url http://localhost:8000/api/v1 \
     --email admin@example.com --password Admin123! \
     --camera-id 1
   ```
   This prints a **reprojection error** in meters — how well the fitted
   homography reproduces your own input points. Under ~0.1-0.3m is
   generally good; a much higher number usually means a mis-measured
   point or points that are nearly collinear.

Once saved, `ai_models/detection/pipeline.py` automatically loads the
camera's calibration and populates `floor_x`/`floor_y` on every tracking
point it pushes — no code changes needed on the detection side.

## Tests

```bash
python -m pytest test_homography.py -v
```

Tests use synthetic ground-truth data (a hand-picked projective
transform) rather than a real camera, and include a held-out-point
check — fitting on 4 points and verifying the homography correctly
predicts a 5th point it never saw, which is what actually proves the
geometry is right rather than just memorizing the input.
