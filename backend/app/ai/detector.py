from __future__ import annotations

import logging
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np
from ultralytics import YOLO

logger = logging.getLogger(__name__)

BACKEND_ROOT = Path(__file__).resolve().parents[2]

# Person detection uses pretrained YOLO26 (COCO, 80 classes) instead of the
# earlier fine-tuned best.pt - a deliberate choice to move to Ultralytics'
# newer architecture. best.pt is left on disk, untouched, in case fine-tuning
# YOLO26 on the same dataset is done later; it's just not loaded by default
# anymore. _ModelRegistry's existing multi-class path (person-by-name lookup)
# handles this model unchanged - no detection-logic changes were needed.
MODEL_PATH = BACKEND_ROOT / "yolo26s.pt"

print(f"[DETECTOR] Using model: {MODEL_PATH}")


@dataclass
class BoundingBox:
    x1: int
    y1: int
    x2: int
    y2: int

    def as_list(self) -> list[int]:
        return [self.x1, self.y1, self.x2, self.y2]

    def center(self) -> tuple[float, float]:
        return ((self.x1 + self.x2) / 2.0, (self.y1 + self.y2) / 2.0)


@dataclass
class Detection:
    bbox: BoundingBox
    confidence: float
    class_id: int
    class_name: str = "person"
    center_x: float = field(init=False)
    center_y: float = field(init=False)

    def __post_init__(self) -> None:
        self.center_x, self.center_y = self.bbox.center()

    def to_dict(self) -> dict:
        return {
            "bbox": self.bbox.as_list(),
            "confidence": round(self.confidence, 4),
            "class_id": self.class_id,
            "class_name": self.class_name,
            "center": [round(self.center_x, 2), round(self.center_y, 2)],
        }


class _ModelRegistry:
    """Loads the model once and works out how to interpret its classes.

    Handles two shapes of model:
      - single-class (our fine-tuned best.pt, model.names == {0: "person"}):
        every box the model returns already IS the target class, so no
        `classes=` filter is applied at inference time.
      - multi-class (fallback yolov8n.pt / any COCO-style model): the
        "person" class id is located by name instead of assumed to be 0,
        and inference is restricted to that class so non-person objects
        (chairs, bottles, etc.) never get reported as people.
    """

    _model: YOLO | None = None
    names: dict[int, str] = {}
    num_classes: int = 0
    person_class_id: int | None = None
    product_class_id: int | None = None
    is_single_class: bool = False

    @classmethod
    def get_model(cls) -> YOLO:
        if cls._model is None:
            print(f"[DETECTOR] Loading model: {MODEL_PATH}")
            cls._model = YOLO(str(MODEL_PATH))

            cls.names = cls._model.names
            cls.num_classes = len(cls.names)
            print(f"[DETECTOR] model.names: {cls.names}")
            print(f"[DETECTOR] number of classes: {cls.num_classes}")

            if cls.num_classes == 1:
                cls.is_single_class = True
                cls.person_class_id = next(iter(cls.names.keys()))
                print(
                    f"[DETECTOR] Single-class model detected. Treating class "
                    f"{cls.person_class_id} ('{cls.names[cls.person_class_id]}') as "
                    "person. No class filtering will be applied (there's only one "
                    "class for the model to output)."
                )
            else:
                cls.is_single_class = False
                cls.person_class_id = next(
                    (cid for cid, name in cls.names.items() if name.lower() == "person"),
                    None,
                )
                if cls.person_class_id is None:
                    logger.error(
                        "Multi-class model loaded (%d classes) but none of them is "
                        "named 'person'. Available classes: %s. detect_people() will "
                        "return no detections until the correct model is loaded.",
                        cls.num_classes,
                        cls.names,
                    )
                else:
                    print(
                        f"[DETECTOR] Multi-class model detected. Auto-detected person "
                        f"class id={cls.person_class_id} ('{cls.names[cls.person_class_id]}'). "
                        "Inference will be restricted to this class."
                    )

                cls.product_class_id = next(
                    (cid for cid, name in cls.names.items() if name.lower() == "product"),
                    None,
                )
                if cls.product_class_id is not None:
                    print(
                        f"[DETECTOR] Auto-detected product class id={cls.product_class_id} "
                        f"('{cls.names[cls.product_class_id]}')."
                    )
        return cls._model


def detect_people(frame: np.ndarray, confidence: float = 0.20) -> list[Detection]:
    if frame is None or not isinstance(frame, np.ndarray) or frame.size == 0:
        logger.warning("detect_people() received an invalid frame (None/empty); skipping.")
        return []

    model = _ModelRegistry.get_model()
    logger.debug(
        "detect_people: frame shape=%s dtype=%s conf_threshold=%s",
        frame.shape,
        frame.dtype,
        confidence,
    )

    if _ModelRegistry.num_classes > 1 and _ModelRegistry.person_class_id is None:
        # Multi-class model with no identifiable "person" class - refuse to
        # guess, rather than silently mislabeling arbitrary objects as people.
        return []

    predict_kwargs = {"conf": confidence, "verbose": False}
    if not _ModelRegistry.is_single_class:
        # Only restrict to the person class for multi-class models.
        # Requirement: never apply a class filter to single-class models.
        predict_kwargs["classes"] = [_ModelRegistry.person_class_id]

    results = model(frame, **predict_kwargs)

    detections: list[Detection] = []
    for result in results:
        boxes = result.boxes
        if boxes is None:
            continue

        for box in boxes:
            class_id = int(box.cls[0])
            class_name = _ModelRegistry.names.get(class_id, str(class_id))
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            conf = float(box.conf[0])
            detections.append(
                Detection(
                    bbox=BoundingBox(x1, y1, x2, y2),
                    confidence=conf,
                    class_id=class_id,
                    class_name=class_name,
                )
            )

    logger.debug("detect_people: %d detection(s) -> %s", len(detections),
                 [(d.class_name, round(d.confidence, 2)) for d in detections])
    if not detections:
        logger.debug("detect_people: 0 people found in this frame")

    return detections


def detect_products(frame: np.ndarray, confidence: float = 0.20) -> list[Detection]:
    """
    Same pattern as detect_people(), filtered to the 'product' class instead.
    Returns [] for any model that doesn't have a product class (e.g. the
    single-class person-only model) - this is a no-op there, not an error.
    """
    if frame is None or not isinstance(frame, np.ndarray) or frame.size == 0:
        logger.warning("detect_products() received an invalid frame (None/empty); skipping.")
        return []

    _ModelRegistry.get_model()  # ensure names/product_class_id are populated
    if _ModelRegistry.product_class_id is None:
        return []

    model = _ModelRegistry.get_model()
    results = model(frame, conf=confidence, classes=[_ModelRegistry.product_class_id], verbose=False)

    detections: list[Detection] = []
    for result in results:
        boxes = result.boxes
        if boxes is None:
            continue

        for box in boxes:
            class_id = int(box.cls[0])
            class_name = _ModelRegistry.names.get(class_id, str(class_id))
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            conf = float(box.conf[0])
            detections.append(
                Detection(
                    bbox=BoundingBox(x1, y1, x2, y2),
                    confidence=conf,
                    class_id=class_id,
                    class_name=class_name,
                )
            )

    logger.debug("detect_products: %d detection(s)", len(detections))
    return detections


WORLD_MODEL_PATH = BACKEND_ROOT / "yolov8s-world.pt"

# The fine-tuned model's 'product' class doesn't generalize to real store
# footage (confirmed: 0 detections across multiple real test videos, vs.
# working fine on its own training-domain images). 'product' itself is too
# abstract a text prompt for CLIP-based open-vocabulary matching, but
# concrete nouns for what products actually look like work well - confirmed
# visually on real footage (bottles, boxes, packaged food all correctly
# boxed, plus real shelf regions - something no prior model in this project
# could do at all, since no shelf-labeled training data exists anywhere).
WORLD_CLASSES = ["shelf", "bottle", "box", "package", "packaged food", "grocery item", "can"]
SHELF_CLASS_NAMES = {"shelf"}


class _WorldModelRegistry:
    """Separate singleton for the open-vocabulary YOLO-World model used for
    product/shelf detection - independent of _ModelRegistry's fine-tuned
    person model, no shared state between them."""

    _model: YOLO | None = None

    @classmethod
    def get_model(cls) -> YOLO:
        if cls._model is None:
            print(f"[DETECTOR] Loading YOLO-World model: {WORLD_MODEL_PATH}")
            cls._model = YOLO(str(WORLD_MODEL_PATH))
            cls._model.set_classes(WORLD_CLASSES)
            print(f"[DETECTOR] YOLO-World classes: {WORLD_CLASSES}")
        return cls._model


# NMS IoU threshold. Ultralytics' own default (0.7) is tuned for COCO-style
# scenes where objects are usually well-separated; retail shelves pack
# products edge-to-edge, so overlapping boxes are more likely to be the same
# product double-counted than two distinct products. Verified on real footage
# (Beverage Section.mp4, confidence=0.10): 0.5 removes a duplicate box that
# 0.7 keeps (18 -> 17 detections) without changing the confidence threshold
# already validated earlier in this project. This is an NMS/overlap claim,
# not an accuracy claim - there's no labeled ground truth to compute
# precision/recall against, so "fewer overlapping boxes" is what was actually
# measured, not "more correct."
WORLD_NMS_IOU = 0.5


def detect_products_and_shelves(
    frame: np.ndarray, confidence: float = 0.10, iou: float = WORLD_NMS_IOU
) -> tuple[list[Detection], list[Detection]]:
    """
    Zero-shot product + shelf detection via YOLO-World (open-vocabulary,
    text-prompted, no training data required). Returns (products, shelves).

    Much slower per-frame than the fine-tuned yolov8n model (~9x, ~0.6s vs
    ~0.07s per frame on CPU) - fine for batch video processing, callers
    doing live/real-time work should throttle how often this runs.
    """
    if frame is None or not isinstance(frame, np.ndarray) or frame.size == 0:
        logger.warning("detect_products_and_shelves() received an invalid frame; skipping.")
        return [], []

    model = _WorldModelRegistry.get_model()
    results = model.predict(frame, conf=confidence, iou=iou, verbose=False)

    products: list[Detection] = []
    shelves: list[Detection] = []
    for result in results:
        boxes = result.boxes
        if boxes is None:
            continue

        for box in boxes:
            class_id = int(box.cls[0])
            class_name = model.names.get(class_id)
            if class_name is None:
                # Observed in practice: YOLO-World's set_classes() narrows
                # model.names to the prompted vocabulary, but a returned box
                # can still carry a class_id outside that reduced range
                # (e.g. 56 against a 7-class vocabulary) - an Ultralytics
                # quirk, not a validated input to trust. Can't classify
                # shelf-vs-product without a real name, so skip the box
                # rather than crash the whole detection pass (or, for the
                # live stream, the whole feed) over one unrecognized box.
                logger.warning("detect_products_and_shelves: unrecognized class_id=%d outside model.names, skipping box", class_id)
                continue
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            conf = float(box.conf[0])
            det = Detection(
                bbox=BoundingBox(x1, y1, x2, y2),
                confidence=conf,
                class_id=class_id,
                class_name=class_name,
            )
            (shelves if class_name in SHELF_CLASS_NAMES else products).append(det)

    logger.debug(
        "detect_products_and_shelves: %d product(s), %d shelf(s)", len(products), len(shelves)
    )
    return products, shelves


def detect_frame(frame: np.ndarray) -> dict:
    people = detect_people(frame)
    products = detect_products(frame)
    return {
        "people": [d.to_dict() for d in people],
        "products": [d.to_dict() for d in products],
    }


if __name__ == "__main__":
    import sys

    import cv2

    logging.basicConfig(level=logging.DEBUG, format="%(levelname)s:%(name)s:%(message)s")

    if len(sys.argv) < 2:
        print("Usage: python -m app.ai.detector <path_to_image_or_video> [confidence]")
        raise SystemExit(1)

    source_path = Path(sys.argv[1])
    conf_arg = float(sys.argv[2]) if len(sys.argv) > 2 else 0.20

    if source_path.suffix.lower() in {".mp4", ".avi", ".mov", ".webm"}:
        cap = cv2.VideoCapture(str(source_path))
        frame_idx = 0
        total_people = 0
        while True:
            ok, vid_frame = cap.read()
            if not ok:
                break
            found = detect_people(vid_frame, confidence=conf_arg)
            total_people += len(found)
            print(f"frame {frame_idx}: {len(found)} people")
            frame_idx += 1
        cap.release()
        print(f"Done. {frame_idx} frames, {total_people} total detections.")
    else:
        img = cv2.imread(str(source_path))
        found = detect_people(img, confidence=conf_arg)
        print(f"{len(found)} people detected:")
        for d in found:
            print(d.to_dict())
