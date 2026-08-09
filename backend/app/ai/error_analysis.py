"""
Detection failure diagnostics: given a frame and its detections, identify
which *measurable* image conditions are likely degrading detection quality,
and say what to do about each.

Scope, stated plainly: this diagnoses IMAGE CONDITIONS, not detection
correctness. Determining that a specific detection is a false positive, or
that a specific product was missed, requires labeled ground truth for that
frame - which doesn't exist for this store's footage. So this module never
claims "this detection is wrong." It answers the answerable question:
"what about this frame makes detection hard, and what would fix it?"

Every metric here is computed from real pixels, reusing the same
measurement functions the live preprocessing pipeline already uses
(preprocessing.py) rather than reimplementing them.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum

import cv2
import numpy as np

from app.ai.detector import Detection
from app.ai.preprocessing import estimate_blur, estimate_brightness, estimate_noise

# Below this fraction of frame area, a detection is small enough that
# downsampling to the detector's input size costs it most of its pixels.
SMALL_OBJECT_AREA_FRACTION = 0.01
# IoU above this between two detections suggests real overlap/occlusion
# rather than two cleanly separated objects.
OCCLUSION_IOU_THRESHOLD = 0.15
# Detections below this confidence are "marginal" - the model found
# something but isn't sure.
MARGINAL_CONFIDENCE = 0.25
# A region far brighter than the frame average, with low local detail, is
# characteristic of specular glare on plastic/foil packaging.
GLARE_BRIGHTNESS_RATIO = 1.6
GLARE_DETAIL_THRESHOLD = 80.0


class FailureCause(StrEnum):
    POOR_LIGHTING = "poor_lighting"
    MOTION_BLUR = "motion_blur"
    SENSOR_NOISE = "sensor_noise"
    LOW_RESOLUTION = "low_resolution"
    SMALL_DISTANT_OBJECTS = "small_distant_objects"
    OCCLUSION = "occlusion"
    REFLECTION_GLARE = "reflection_glare"
    MARGINAL_CONFIDENCE_DETECTIONS = "marginal_confidence_detections"


REMEDIES: dict[FailureCause, str] = {
    FailureCause.POOR_LIGHTING: (
        "Frame is underexposed. The adaptive gamma/CLAHE step in preprocessing.py already "
        "compensates at inference time; a persistent low reading here means the camera itself "
        "needs more light or a longer exposure - software correction amplifies noise rather than "
        "recovering detail that was never captured."
    ),
    FailureCause.MOTION_BLUR: (
        "Low edge sharpness. Raise the camera's shutter speed (shorter exposure) if configurable. "
        "Software sharpening recovers apparent edges but not lost information."
    ),
    FailureCause.SENSOR_NOISE: (
        "High noise floor, typical of high-ISO/low-light capture. Improve scene lighting so the "
        "camera can use lower gain - denoising trades fine product detail for smoothness."
    ),
    FailureCause.LOW_RESOLUTION: (
        "Source frame is below 1080p. Small shelf products lose most of their pixels when the "
        "frame is downscaled to the detector's input size. Use a 1080p+ camera feed."
    ),
    FailureCause.SMALL_DISTANT_OBJECTS: (
        "Detected objects occupy a very small fraction of the frame. Either move the camera "
        "closer / narrow its field of view, or raise the detector's input resolution (imgsz) so "
        "small objects survive downsampling."
    ),
    FailureCause.OCCLUSION: (
        "Detections overlap substantially - products are stacked, crowded, or blocked by shoppers. "
        "A higher camera angle looking down the shelf face reduces mutual occlusion."
    ),
    FailureCause.REFLECTION_GLARE: (
        "Bright, low-detail regions consistent with specular glare on packaging. Angle the camera "
        "away from direct light sources, or use diffused lighting - glare erases the visual "
        "features the detector relies on."
    ),
    FailureCause.MARGINAL_CONFIDENCE_DETECTIONS: (
        "Many detections sit just above the confidence threshold. This is expected for open-"
        "vocabulary detection (YOLO-World scores lower than a closed-set model trained on these "
        "exact products) - it indicates uncertainty, not necessarily error. Store-specific "
        "training data is what would raise these scores."
    ),
}


@dataclass
class FrameDiagnostics:
    brightness: float
    blur: float
    noise: float
    width: int
    height: int
    detection_count: int
    avg_confidence: float | None
    causes: list[FailureCause]
    remedies: dict[str, str]


def _bbox_iou(a: list[int], b: list[int]) -> float:
    ax1, ay1, ax2, ay2 = a
    bx1, by1, bx2, by2 = b
    inter_x1, inter_y1 = max(ax1, bx1), max(ay1, by1)
    inter_x2, inter_y2 = min(ax2, bx2), min(ay2, by2)
    inter_w, inter_h = max(0, inter_x2 - inter_x1), max(0, inter_y2 - inter_y1)
    intersection = inter_w * inter_h
    if intersection == 0:
        return 0.0
    area_a = max(0, ax2 - ax1) * max(0, ay2 - ay1)
    area_b = max(0, bx2 - bx1) * max(0, by2 - by1)
    union = area_a + area_b - intersection
    return intersection / union if union > 0 else 0.0


def _has_glare(frame: np.ndarray) -> bool:
    """Looks for bright regions that also lack local detail - bright AND
    textured is just a well-lit product; bright AND featureless is glare."""
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    mean_brightness = gray.mean()
    if mean_brightness <= 0:
        return False

    bright_mask = gray > (mean_brightness * GLARE_BRIGHTNESS_RATIO)
    bright_fraction = float(bright_mask.mean())
    if bright_fraction < 0.01:
        return False

    laplacian = cv2.Laplacian(gray, cv2.CV_64F)
    detail_in_bright = float(np.abs(laplacian[bright_mask]).mean()) if bright_mask.any() else 0.0
    return detail_in_bright < GLARE_DETAIL_THRESHOLD


def diagnose_frame(frame: np.ndarray, detections: list[Detection]) -> FrameDiagnostics:
    height, width = frame.shape[:2]
    frame_area = float(height * width)

    brightness = estimate_brightness(frame)
    blur = estimate_blur(frame)
    noise = estimate_noise(frame)

    confidences = [d.confidence for d in detections]
    avg_confidence = float(np.mean(confidences)) if confidences else None

    causes: list[FailureCause] = []

    if brightness < 60.0:
        causes.append(FailureCause.POOR_LIGHTING)
    if blur < 100.0:
        causes.append(FailureCause.MOTION_BLUR)
    if noise > 15.0:
        causes.append(FailureCause.SENSOR_NOISE)
    if height < 1080:
        causes.append(FailureCause.LOW_RESOLUTION)

    if detections:
        areas = [
            (d.bbox.x2 - d.bbox.x1) * (d.bbox.y2 - d.bbox.y1) / frame_area
            for d in detections
        ]
        if float(np.mean(areas)) < SMALL_OBJECT_AREA_FRACTION:
            causes.append(FailureCause.SMALL_DISTANT_OBJECTS)

        overlapping = sum(
            1
            for i in range(len(detections))
            for j in range(i + 1, len(detections))
            if _bbox_iou(detections[i].bbox.as_list(), detections[j].bbox.as_list()) > OCCLUSION_IOU_THRESHOLD
        )
        if overlapping > 0:
            causes.append(FailureCause.OCCLUSION)

        if avg_confidence is not None and avg_confidence < MARGINAL_CONFIDENCE:
            causes.append(FailureCause.MARGINAL_CONFIDENCE_DETECTIONS)

    if _has_glare(frame):
        causes.append(FailureCause.REFLECTION_GLARE)

    return FrameDiagnostics(
        brightness=round(brightness, 1),
        blur=round(blur, 1),
        noise=round(noise, 1),
        width=width,
        height=height,
        detection_count=len(detections),
        avg_confidence=round(avg_confidence, 3) if avg_confidence is not None else None,
        causes=causes,
        remedies={cause.value: REMEDIES[cause] for cause in causes},
    )
