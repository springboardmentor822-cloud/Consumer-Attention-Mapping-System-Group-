"""Lazy Ultralytics YOLO inference with persistent ByteTrack identity state."""

from __future__ import annotations

import json
from collections.abc import Callable, Iterable, Iterator
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

from app.ml.errors import MLConfigurationError
from app.ml.optional import require_module
from app.ml.video import VideoFrame


def classify_retail_item(class_id: int, class_name: str, bbox_xyxy: tuple[float, float, float, float]) -> tuple[str, str]:
    name = class_name.lower()
    left, top, right, bottom = bbox_xyxy
    width = max(1.0, right - left)
    height = max(1.0, bottom - top)
    aspect_ratio = width / height

    if class_id == 0 or name == "person":
        return ("human", "HUMAN")

    if name in {"dining table", "bench", "couch", "refrigerator", "microwave", "oven", "tv", "desk"}:
        if name in {"dining table", "desk"}:
            return ("shelf_structure", "RETAIL DISPLAY COUNTER")
        elif name == "refrigerator":
            return ("shelf_structure", "REFRIGERATED DISPLAY")
        else:
            return ("shelf_structure", "SHELF / DISPLAY RACK")

    if name in {"backpack", "handbag", "suitcase"}:
        return ("bag_basket", "SHOPPER BAG / BASKET")

    # Supermarket product distinctions
    if name == "bottle":
        return ("product", "BEVERAGE BOTTLE")
    elif name == "cup":
        return ("product", "DRINK CUP")
    elif name == "bowl":
        return ("product", "CONTAINER / BOWL")
    elif name in {"apple", "orange", "banana", "broccoli", "carrot"}:
        return ("product", f"PRODUCE: {name.upper()}")
    elif name in {"sandwich", "donut", "cake", "pizza", "hot dog"}:
        return ("product", f"SNACK: {name.upper()}")
    elif name in {"cell phone", "book", "clock", "vase", "scissors"}:
        return ("product", "PACKAGED SKU / BOX")
    
    # Structure heuristic: wide horizontal surfaces
    if aspect_ratio > 2.0 and width > 180 and top > 100:
        return ("shelf_structure", "SHELF STRUCTURE")

    return ("product", name.upper())


@dataclass(frozen=True)
class Detection:
    track_id: int | None
    class_id: int
    class_name: str
    confidence: float
    bbox_xyxy: tuple[float, float, float, float]
    retail_category: str = "product"
    display_label: str = ""

    @property
    def center_xy(self) -> tuple[float, float]:
        left, top, right, bottom = self.bbox_xyxy
        return (left + right) / 2, (top + bottom) / 2


@dataclass(frozen=True)
class TrackedFrame:
    frame_index: int
    timestamp_seconds: float | None
    detections: tuple[Detection, ...]

    def to_dict(self) -> dict[str, Any]:
        return {
            "frame_index": self.frame_index,
            "timestamp_seconds": self.timestamp_seconds,
            "detections": [
                {**asdict(detection), "center_xy": detection.center_xy}
                for detection in self.detections
            ],
        }


class YOLOByteTracker:
    """Reuse one YOLO model and one ByteTrack state across sequential frames.

    Ultralytics is imported only when the first frame is processed. ``persist``
    is always true; call :meth:`reset` between unrelated cameras or videos.
    """

    def __init__(
        self,
        model: str | Path,
        *,
        confidence_threshold: float = 0.25,
        iou_threshold: float = 0.7,
        classes: tuple[int, ...] | list[int] | None = None,
        device: str | int | None = None,
        tracker_config: str = "bytetrack.yaml",
        model_factory: Callable[[str], Any] | None = None,
    ):
        if not 0.0 <= confidence_threshold <= 1.0:
            raise MLConfigurationError("confidence_threshold must be in [0, 1].")
        if not 0.0 <= iou_threshold <= 1.0:
            raise MLConfigurationError("iou_threshold must be in [0, 1].")
        if not tracker_config:
            raise MLConfigurationError("tracker_config cannot be empty.")
        self.model_reference = str(model)
        self.confidence_threshold = confidence_threshold
        self.iou_threshold = iou_threshold
        self.classes = tuple(classes) if classes is not None else None
        self.device = device
        self.tracker_config = tracker_config
        self._model_factory = model_factory
        self._model: Any | None = None
        self._next_frame_index = 0
        self._smoothed_boxes: dict[int, tuple[float, float, float, float]] = {}

    @property
    def loaded(self) -> bool:
        return self._model is not None

    def _load_model(self) -> Any:
        if self._model is not None:
            return self._model
        if self._model_factory is not None:
            factory = self._model_factory
        else:
            ultralytics = require_module(
                "ultralytics",
                purpose="YOLO detection and persistent ByteTrack inference",
                install_command="python -m pip install ultralytics",
            )
            factory = ultralytics.YOLO
        self._model = factory(self.model_reference)
        return self._model

    def process_frame(
        self,
        image: Any,
        *,
        timestamp_seconds: float | None = None,
        frame_index: int | None = None,
        confidence_threshold: float | None = None,
        classes: tuple[int, ...] | list[int] | None = None,
    ) -> TrackedFrame:
        model = self._load_model()
        index = self._next_frame_index if frame_index is None else frame_index
        if index < 0:
            raise MLConfigurationError("frame_index cannot be negative.")
        
        conf = confidence_threshold if confidence_threshold is not None else self.confidence_threshold
        cls_list = classes if classes is not None else self.classes

        kwargs: dict[str, Any] = {
            "source": image,
            "persist": True,
            "tracker": self.tracker_config,
            "conf": conf,
            "iou": self.iou_threshold,
            "verbose": False,
        }
        if cls_list is not None:
            kwargs["classes"] = list(cls_list)
        if self.device is not None:
            kwargs["device"] = self.device
        results = model.track(**kwargs)
        first_result = results[0] if results else None
        raw_detections = tuple(self._parse_result(first_result, model)) if first_result is not None else ()

        # Temporal Exponential Moving Average (EMA) box smoothing (alpha = 0.75)
        alpha = 0.75
        smoothed_list: list[Detection] = []
        for det in raw_detections:
            if det.track_id is not None:
                tid = det.track_id
                if tid in self._smoothed_boxes:
                    prev_x1, prev_y1, prev_x2, prev_y2 = self._smoothed_boxes[tid]
                    x1, y1, x2, y2 = det.bbox_xyxy
                    sm_box = (
                        alpha * x1 + (1 - alpha) * prev_x1,
                        alpha * y1 + (1 - alpha) * prev_y1,
                        alpha * x2 + (1 - alpha) * prev_x2,
                        alpha * y2 + (1 - alpha) * prev_y2,
                    )
                else:
                    sm_box = det.bbox_xyxy
                self._smoothed_boxes[tid] = sm_box
                smoothed_list.append(Detection(
                    det.track_id, det.class_id, det.class_name, det.confidence, sm_box,
                    retail_category=det.retail_category, display_label=det.display_label
                ))
            else:
                smoothed_list.append(det)

        detections = tuple(smoothed_list)
        self._next_frame_index = max(self._next_frame_index, index + 1)
        return TrackedFrame(index, timestamp_seconds, detections)

    def process_video_frames(self, frames: Iterable[VideoFrame]) -> Iterator[TrackedFrame]:
        for frame in frames:
            yield self.process_frame(
                frame.image,
                timestamp_seconds=frame.timestamp_seconds,
                frame_index=frame.source_index,
            )

    def reset(self) -> None:
        """Discard model/predictor state so ByteTrack IDs cannot leak across streams."""

        self._model = None
        self._next_frame_index = 0
        self._smoothed_boxes.clear()

    @staticmethod
    def _parse_result(result: Any, model: Any) -> Iterator[Detection]:
        boxes = getattr(result, "boxes", None)
        if boxes is None:
            return
        xyxy_rows = _to_list(getattr(boxes, "xyxy", []))
        confidence_values = _flatten(_to_list(getattr(boxes, "conf", [])))
        class_values = _flatten(_to_list(getattr(boxes, "cls", [])))
        raw_ids = getattr(boxes, "id", None)
        track_values = _flatten(_to_list(raw_ids)) if raw_ids is not None else []
        names = getattr(result, "names", None) or getattr(model, "names", {})

        for index, row in enumerate(xyxy_rows):
            if index >= len(confidence_values) or index >= len(class_values) or len(row) < 4:
                continue
            class_id = int(class_values[index])
            if isinstance(names, dict):
                class_name = str(names.get(class_id, class_id))
            elif isinstance(names, (list, tuple)) and 0 <= class_id < len(names):
                class_name = str(names[class_id])
            else:
                class_name = str(class_id)
            track_id = int(track_values[index]) if index < len(track_values) and track_values[index] is not None else None
            box_tuple = tuple(float(value) for value in row[:4])
            ret_cat, disp_label = classify_retail_item(class_id, class_name, box_tuple)  # type: ignore[arg-type]

            yield Detection(
                track_id=track_id,
                class_id=class_id,
                class_name=class_name,
                confidence=float(confidence_values[index]),
                bbox_xyxy=box_tuple,  # type: ignore[arg-type]
                retail_category=ret_cat,
                display_label=disp_label,
            )


def _to_list(value: Any) -> list[Any]:
    if value is None:
        return []
    for method_name in ("detach", "cpu"):
        method = getattr(value, method_name, None)
        if callable(method):
            value = method()
    tolist = getattr(value, "tolist", None)
    if callable(tolist):
        value = tolist()
    if isinstance(value, tuple):
        return list(value)
    if isinstance(value, list):
        return value
    return [value]


def _flatten(values: list[Any]) -> list[Any]:
    flattened: list[Any] = []
    for value in values:
        if isinstance(value, (list, tuple)) and len(value) == 1:
            flattened.append(value[0])
        else:
            flattened.append(value)
    return flattened


def write_tracks_jsonl(tracks: Iterable[TrackedFrame], output_path: str | Path) -> Path:
    """Stream tracking output to JSONL without retaining the video in memory."""

    destination = Path(output_path).expanduser().resolve()
    destination.parent.mkdir(parents=True, exist_ok=True)
    with destination.open("w", encoding="utf-8") as handle:
        for tracked_frame in tracks:
            handle.write(json.dumps(tracked_frame.to_dict(), sort_keys=True) + "\n")
    return destination
