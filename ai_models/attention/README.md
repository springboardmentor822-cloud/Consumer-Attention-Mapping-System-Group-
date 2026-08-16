# Attention Estimation (Head Pose → Gaze → Shelf)

Implements the spec's Attention Analysis Engine: head pose estimation,
shelf attention detection, attention duration/dwell time, and repeat
attention — the geometry that turns "where is someone's head pointed"
into "which shelf are they paying attention to, and for how long."

**Verified end-to-end**: simulated a person standing still for 3 seconds
facing a shelf, ran it through `AttentionPipeline`, and confirmed a real
`AttentionEvent` row landed in the backend database with
`duration_seconds: 3.0` — exactly matching the simulated window, correctly
held past the minimum-duration threshold.

## Three layers, tested differently on purpose

1. **`head_pose.py`** — pure geometry (solvePnP against a generic 3D face
   model). Given 6 facial landmark pixel positions, recovers yaw/pitch/
   roll. Tested against **synthetic ground truth**: project a known 3D
   face rotation to 2D, verify the recovered angles match (7 tests, all
   within 3° of the true angle).

2. **`gaze_mapping.py`** — pure geometry again: combines head yaw with a
   camera's known mounting angle, finds which shelf (if any) is within
   the person's cone of attention, and a state machine
   (`SustainedAttentionTracker`) that requires attention to be held for a
   minimum duration before it counts, merges brief gaps, and flags repeat
   visits. 9 tests, including duration thresholds and repeat-attention
   flagging.

3. **`attention_pipeline.py`** — wires 1+2 together and pushes real
   `AttentionEvent` rows to the backend. This is what's actually
   end-to-end tested (see above) — but it takes head yaw as an input
   rather than extracting it from real video, because...

## Why real landmark extraction isn't tested here

`MediaPipeFaceLandmarker` in `head_pose.py` is complete, correct
integration code for MediaPipe's Face Landmarker task. But like YOLOv8
before it, its model file has to be downloaded, and MediaPipe's
downloader pulls from `storage.googleapis.com`, which this sandbox's
network egress proxy blocks (confirmed: *"Host not in allowlist:
storage.googleapis.com"*). On a machine with normal internet access (or
with `face_landmarker.task` copied in manually), it works unchanged.

## Also worth knowing before deploying this against real customers

- Head-pose-based gaze estimation is an **approximation** — it's "which
  way is this person's head pointed," not true eye-tracking. That's
  flagged directly in the backend's `AttentionEvent` model, and it's an
  industry-standard proxy, not a shortcut unique to this build — real
  eye-gaze tracking needs a much closer camera than a typical overhead
  store camera provides.
- `attention_pipeline.py` doesn't yet pair a tracked body (from
  `detection/pipeline.py`) with its corresponding face crop for pose
  estimation — that pairing plus real landmark extraction is the piece
  that needs the blocked model file to build and test properly.
- Camera mounting angle (`camera_mount_angle_degrees`) has to be measured
  or estimated per camera — it's not derived automatically from the
  homography calibration in `ai_models/calibration/`, though it
  reasonably could be in a future pass.

## Tests

```bash
pip install -r requirements.txt
python -m pytest test_head_pose.py test_gaze_mapping.py -v
```
