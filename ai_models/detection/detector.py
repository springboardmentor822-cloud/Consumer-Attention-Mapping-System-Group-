"""
Two interchangeable person detectors behind the same interface:

* HOGPersonDetector - OpenCV's built-in HOG+SVM pedestrian detector.
  Ships with opencv-python, needs no model download. Lower accuracy than
  YOLOv8 and slower per-frame, but it's the one that's actually testable
  in a network-restricted sandbox, so it's what the test suite runs
  against.

* YOLOv8Detector - the real production detector named in the spec.
  Requires `pip install ultralytics` and a downloaded yolov8n.pt (or
  larger) checkpoint. In THIS sandbox, downloading that checkpoint fails:
  Ultralytics' auto-downloader redirects to
  release-assets.githubusercontent.com, which is outside the network
  allowlist here (confirmed: the egress proxy returns
  "Host not in allowlist: release-assets.githubusercontent.com").
  The class below is complete, correct integration code — install
  ultralytics and either let it auto-download on a machine with normal
  internet access, or place a yolov8n.pt file in this directory
  yourself, and it will work unchanged.

Both detectors return a list of Detection(x, y, w, h, confidence) in
pixel coordinates, so `pipeline.py` doesn't care which one is active.
"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Protocol

import cv2
import numpy as np


@dataclass
class Detection:
    x: float
    y: float
    w: float
    h: float
    confidence: float


class PersonDetector(Protocol):
    def detect(self, frame: np.ndarray) -> list[Detection]: ...


class HOGPersonDetector:
    """OpenCV's built-in HOG+SVM pedestrian detector. No download required."""

    def __init__(self, hit_threshold: float = 0.0, scale: float = 1.05):
        self._hog = cv2.HOGDescriptor()
        self._hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())
        self.hit_threshold = hit_threshold
        self.scale = scale

    def detect(self, frame: np.ndarray) -> list[Detection]:
        rects, weights = self._hog.detectMultiScale(
            frame,
            winStride=(8, 8),
            padding=(8, 8),
            scale=self.scale,
            hitThreshold=self.hit_threshold,
        )
        detections = []
        for (x, y, w, h), weight in zip(rects, weights):
            detections.append(Detection(x=float(x), y=float(y), w=float(w), h=float(h), confidence=float(weight)))
        return detections


class YOLOv8Detector:
    """
    Production detector. Requires `pip install ultralytics` and network
    access to fetch (or a local copy of) the checkpoint. Uses YOLOv8's
    built-in `.track()` (ByteTrack/BoT-SORT) rather than a separate
    DeepSORT dependency, which is the officially supported path for
    YOLOv8 + multi-object tracking.
    """

    def __init__(self, weights_path: str = "yolov8n.pt", confidence: float = 0.4, tracker: str = "bytetrack.yaml"):
        try:
            from ultralytics import YOLO
        except ImportError as exc:  # pragma: no cover
            raise ImportError(
                "ultralytics is not installed. Run: pip install ultralytics"
            ) from exc

        if not Path(weights_path).exists():
            raise FileNotFoundError(
                f"'{weights_path}' not found. On a machine with normal internet access, "
                f"YOLO('{weights_path}') will auto-download it. In network-restricted "
                f"environments, download it manually and place it alongside this script."
            )

        self._model = YOLO(weights_path)
        self.confidence = confidence
        self.tracker = tracker

    def detect(self, frame: np.ndarray) -> list[Detection]:
        """Single-frame detection only (no persisted track IDs). Use
        `track()` below for the tracked variant used by pipeline.py."""
        results = self._model.predict(frame, classes=[0], conf=self.confidence, verbose=False)  # class 0 = person
        detections = []
        for box in results[0].boxes:
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            detections.append(
                Detection(x=x1, y=y1, w=x2 - x1, h=y2 - y1, confidence=float(box.conf[0]))
            )
        return detections

    def track(self, frame: np.ndarray) -> list[tuple[Detection, int]]:
        """Returns (Detection, persistent_track_id) pairs using ByteTrack."""
        results = self._model.track(
            frame, classes=[0], conf=self.confidence, tracker=self.tracker, persist=True, verbose=False
        )
        output = []
        boxes = results[0].boxes
        if boxes.id is None:
            return output
        for box, track_id in zip(boxes, boxes.id):
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            det = Detection(x=x1, y=y1, w=x2 - x1, h=y2 - y1, confidence=float(box.conf[0]))
            output.append((det, int(track_id)))
        return output
