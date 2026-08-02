"""
Step 2: Detection models.
  - PersonDetector: pretrained YOLOv8, filtered to COCO class 0 (person).
    Tracker: ByteTrack, via Ultralytics' built-in .track(). Kept as-is -
    the Milestone 2 kickoff doc explicitly names ByteTrack for shopper
    tracking and says not to deviate from named tools without checking in
    first. Do not change this to DeepSORT.
  - ProductDetector: your custom checkout_detector_v4 weights (RPC's 200
    product classes). Tracker: DeepSORT, NOT ByteTrack.

Why ProductDetector uses a different tracker than PersonDetector:
Confirmed via check_product_detector.py that ByteTrack's IoU/motion-based
matching breaks down on Zone_2.mp4 specifically because that camera pans/
moves - products slide across frame and leave/re-enter at very different
pixel positions within a few frames, so IoU-based matching (which only
compares WHERE a box was) can't link "this chocolate bar that just
vanished" to "this chocolate bar that reappeared 8 frames later
elsewhere." Track IDs climbed past 50 within 10 frames as a result -
constant reassignment, not real object turnover.

DeepSORT fixes this specific failure by also comparing WHAT a box looks
like (an appearance embedding), not just where it was - so it can
re-match an item across a gap in position, which is exactly what a moving
camera creates. This is the "smarter tracking method" fix for products;
it is a genuinely different mechanism from ByteTrack, not a config swap.

Dependency: DeepSORT is NOT one of Ultralytics' built-in trackers
(bytetrack.yaml / botsort.yaml ship with .track()) - it needs a separate
package:
    pip install deep-sort-realtime --break-system-packages
"""

from typing import Iterator
from pathlib import Path

import numpy as np
from deep_sort_realtime.deepsort_tracker import DeepSort
from ultralytics import YOLO

from app.services.frame_pipeline import DEVICE, FrameSource

COCO_PERSON_CLASS = 0  # COCO's own taxonomy - do NOT confuse with
                        # MOT17_GT_CLASS in frame_pipeline.py, which is a
                        # different, unrelated single-class label space.

PERSON_MODEL_WEIGHTS = "yolov8s.pt"  # auto-downloads on first use

# Same path used in spotcheck_cluttered_val.py / full_validation_check.py -
# update if best.pt has moved since then.
PRODUCT_MODEL_WEIGHTS = (
    r"C:\Users\ritik\Downloads\Consumer Attention Mapping\backend"
    r"\runs\detect\runs\detect\runs\checkout_detector_v4\weights\best.pt"
)


class PersonDetector:
    """Unchanged from before - ByteTrack, per the Milestone 2 doc."""

    def __init__(
        self,
        weights: str = PERSON_MODEL_WEIGHTS,
        conf: float = 0.25,
        tracker: str = "bytetrack.yaml",
    ):
        self.model = YOLO(weights)
        self.model.to(DEVICE)
        self.conf = conf
        # tracker: REVERTED to Ultralytics' stock bytetrack.yaml
        # (track_buffer=30) as the safe global default. A custom
        # track_buffer=60 config was tried (tune_person_tracker.py) and
        # DID fix Zone_2.mp4's ID churn (6 -> 2 distinct ids, matching
        # ground truth). But the SAME change caused a severe, unexplained
        # regression on Zone_1.mp4: 904/954 frames silently dropped to 0
        # track_ids despite having real detected boxes (confirmed via
        # debug_person_tracking.py + debug_confidence_levels.py). Stock
        # bytetrack.yaml (buffer=30) on the identical Zone_1.mp4 clip
        # produced 0 dropped frames and 198 distinct ids - so this is not
        # a confidence-threshold issue (both configs share
        # track_high_thresh=0.5), it's specifically triggered by the
        # track_buffer value change, root cause not identified.
        # One global default can't serve both cameras well: buffer=30
        # avoids the catastrophic Zone_1 data loss at the cost of
        # Zone_2's known, milder, already-documented ID churn. Silently
        # dropping ~95% of a camera's data is the worse failure, so
        # buffer=30 (stock) is the safer default until this is properly
        # root-caused. Per-camera tracker override remains available via
        # this constructor arg (e.g. bytetrack_buffer60.yaml specifically
        # for Zone_2) if you want to opt into it for cameras that are
        # confirmed to behave like Zone_2, not Zone_1.
        self.tracker = tracker

    def detect_source(self, source: FrameSource) -> Iterator[dict]:
        for frame in source:
            result = self.model.track(
                source=frame.image_bgr,
                classes=[COCO_PERSON_CLASS],
                conf=self.conf,
                tracker=self.tracker,
                device=DEVICE,
                persist=True,
                verbose=False,
            )[0]

            boxes = result.boxes
            yield {
                "frame_index": frame.index,
                "source_id": frame.source_id,
                "track_ids": boxes.id.tolist() if boxes.id is not None else [],
                "xyxy": boxes.xyxy.tolist(),
                "conf": boxes.conf.tolist(),
            }


class ProductDetector:
    """
    Detection: same checkout_detector_v4 model as before, run with
    .predict() instead of .track() - DeepSORT does its own tracking, so
    we only want raw per-frame detections from YOLO here, not Ultralytics'
    own (ByteTrack-based) tracking on top of them.

    Tracking: DeepSort (deep_sort_realtime), fed the raw detections plus
    the actual frame image - DeepSORT needs the image to compute each
    detection's appearance embedding, which is the whole point of using
    it over ByteTrack.
    """

    def __init__(
        self,
        weights: str = PRODUCT_MODEL_WEIGHTS,
        conf: float = 0.25,
        iou: float = 0.7,
        max_age: int = 90,
    ):
        self.model = YOLO(weights)
        self.model.to(DEVICE)
        self.conf = conf
        self.iou = iou
        # max_age: how many frames a track survives with no matching
        # detection before DeepSORT gives up on it - i.e. how long an
        # item can stay off-frame/occluded and still get its old ID back
        # when it reappears. DeepSORT's own default is 30; raised to 90
        # after tuning against Zone_2.mp4 specifically - measured
        # distinct-track-id counts on a fixed ~596-frame run showing
        # ~30 real visible items/frame: max_age=30 -> 142 distinct IDs,
        # max_age=90 -> 103, max_age=150 -> 97. Gains diminish sharply
        # past 90 (large improvement 30->90, small improvement 90->150),
        # so 90 is the current best cost/benefit point. The remaining
        # gap vs ~30 real items is believed to be DeepSORT's appearance
        # embedding struggling to re-identify visually similar adjacent
        # SKUs (multiple dried_food/tissue variants on this shelf), which
        # max_age tuning alone cannot fully close - documented as a known
        # limitation rather than something to keep tuning away.
        self.tracker = DeepSort(max_age=max_age)

    def detect_source(self, source: FrameSource) -> Iterator[dict]:
        for frame in source:
            result = self.model.predict(
                source=frame.image_bgr,
                conf=self.conf,
                iou=self.iou,
                device=DEVICE,
                verbose=False,
            )[0]

            boxes = result.boxes
            # deep_sort_realtime expects detections as a list of
            # ([left, top, width, height], confidence, class_name) tuples -
            # different box format than Ultralytics' own xyxy, so convert.
            raw_detections = []
            for box_xyxy, conf, cls in zip(
                boxes.xyxy.tolist(), boxes.conf.tolist(), boxes.cls.tolist()
            ):
                x1, y1, x2, y2 = box_xyxy
                ltwh = [x1, y1, x2 - x1, y2 - y1]
                class_name = self.model.names[int(cls)]
                raw_detections.append((ltwh, conf, class_name))

            tracks = self.tracker.update_tracks(raw_detections, frame=frame.image_bgr)

            track_ids, xyxy, class_names = [], [], []
            for track in tracks:
                if not track.is_confirmed():
                    # DeepSORT needs a few consecutive matches before it
                    # trusts a track enough to report it - skip
                    # unconfirmed ones rather than yielding noisy,
                    # not-yet-reliable IDs.
                    continue
                track_ids.append(track.track_id)
                xyxy.append(track.to_ltrb().tolist())  # back to [x1,y1,x2,y2]
                class_names.append(track.get_det_class())

            yield {
                "frame_index": frame.index,
                "source_id": frame.source_id,
                "track_ids": track_ids,
                "xyxy": xyxy,
                "class_names": class_names,
            }


if __name__ == "__main__":
    from sqlmodel import Session, select

    from app.core.db import engine
    from app.models.camera import Camera
    from app.services.frame_pipeline import get_camera_source

    with Session(engine) as session:
        cameras = session.exec(select(Camera).where(Camera.is_active == True)).all()

    if not cameras:
        print("No active Camera rows found - insert Camera data before running this smoke test.")
    else:
        camera = cameras[0]
        src = get_camera_source(camera)

        person_detector = PersonDetector()
        for i, det in enumerate(person_detector.detect_source(src)):
            print(det["frame_index"], "shoppers:", len(det["track_ids"]))
            if i >= 5:
                break
