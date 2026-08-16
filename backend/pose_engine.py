"""
pose_engine.py — Lightweight pose-estimation-based "reach" detection.

Upgrades the old dwell-time proxy in main.py's _detect_interactions()
("a pause >= 2.5s in front of a shelf = a pickup") toward true action
recognition, by physically checking whether a tracked person's arm is
extended toward a shelf using MediaPipe Pose landmarks on each person's
cropped bounding box.

Uses MediaPipe's current Tasks API (`PoseLandmarker`) rather than the older
`mediapipe.solutions.pose` — the legacy `solutions` API is deprecated
project-wide and, in current mediapipe pip wheels, isn't guaranteed to be
bundled at all (confirmed while building this: `import mediapipe.solutions`
raised AttributeError on mediapipe 0.10.33). PoseLandmarker is the
actively-maintained path going forward.

One real consequence of that: PoseLandmarker needs a `.task` model file on
disk, not just the pip package. This module auto-downloads the official
"lite" pose model (~6MB, Google-hosted) into a local `models/` folder next
to this file on first use, and caches it there for every run after. That
download needs outbound network access once — if the deployment environment
has none, pre-download the file yourself and place it at the MODEL_PATH
below, or set the POSE_MODEL_PATH env var to point at an existing copy.

Honesty note: this is still a heuristic, not a learned "reaching for a
shelf" classifier — PoseLandmarker gives body keypoints, not intent. What
this actually detects is: an arm is extended away from the torso, roughly
straight, with the wrist displaced well past the shoulder line. That's a
solid physical proxy for reaching, but it will also fire for e.g. pointing
or adjusting a bag strap. It's combined with the existing dwell-time pause
in main.py (a shelf-side reach usually co-occurs with a pause) to cut down
false positives, but this is worth validating against real footage before
fully trusting the pickup counts — the same caution the rest of this
codebase applies to any inferred metric.

Falls back to "no reach detected" (never raises) if mediapipe isn't
installed or the model can't be loaded, so environments that skip this
optional dependency keep working — main.py detects that no pose data ever
came back and automatically drops to the old dwell-time-only proxy rather
than reporting zero pickups everywhere.
"""
import os
import threading
import urllib.request

import cv2
import numpy as np

_MEDIAPIPE_AVAILABLE = True
try:
    import mediapipe as mp
    from mediapipe.tasks.python import BaseOptions
    from mediapipe.tasks.python.vision import (
        PoseLandmarker,
        PoseLandmarkerOptions,
        RunningMode,
    )
except ImportError:
    _MEDIAPIPE_AVAILABLE = False
    print(
        "⚠️ mediapipe not installed — pose-based reach detection disabled. "
        "Pickup counts will fall back to the dwell-time-only proxy. "
        "Run `pip install mediapipe` to enable true action recognition."
    )

_MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")
MODEL_PATH = os.getenv("POSE_MODEL_PATH", os.path.join(_MODEL_DIR, "pose_landmarker_lite.task"))
_MODEL_URL = (
    "https://storage.googleapis.com/mediapipe-models/pose_landmarker/"
    "pose_landmarker_lite/float16/1/pose_landmarker_lite.task"
)

# Minimum landmark visibility (PoseLandmarker's own per-joint confidence,
# 0-1) before a shoulder/elbow/wrist is trusted for the reach calculation.
# Below this, the joint is probably occluded (e.g. behind a shelf edge) and
# any angle/distance computed from it would be noise, not signal.
MIN_LANDMARK_VISIBILITY = 0.5

# An arm counts as "extended" once the elbow angle (shoulder-elbow-wrist) is
# at least this many degrees — near-straight. Angle alone isn't enough to
# mean "reaching," though — a relaxed arm hanging at rest is also close to
# straight. It's the combination with wrist displacement below that
# distinguishes "reaching out" from "arm hanging down."
MIN_ELBOW_EXTENSION_DEGREES = 140.0

# Wrist must be at least this many multiples of shoulder-width away from the
# torso's vertical centerline (horizontally) to count as reaching rather
# than resting at the side. Tune against real footage — narrower aisles or
# side-on camera angles may need a different ratio.
MIN_WRIST_DISPLACEMENT_RATIO = 0.6

# MediaPipe's standard 33-point pose landmark indices (same numbering used
# across both the old solutions API and the current Tasks API).
LEFT_SHOULDER, RIGHT_SHOULDER = 11, 12
LEFT_ELBOW, RIGHT_ELBOW = 13, 14
LEFT_WRIST, RIGHT_WRIST = 15, 16
NOSE = 0


def _ensure_model_downloaded() -> bool:
    """Returns True if the .task model file is present (downloading it on
    first use if needed), False if it couldn't be obtained."""
    if os.path.exists(MODEL_PATH):
        return True
    try:
        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
        print(f"⬇️ Downloading pose landmarker model to {MODEL_PATH} (one-time, ~6MB)...")
        urllib.request.urlretrieve(_MODEL_URL, MODEL_PATH)
        return True
    except Exception as e:
        print(
            f"⚠️ Could not download pose landmarker model ({e}). Pose-based reach "
            f"detection will stay disabled. Pre-download it manually to {MODEL_PATH} "
            f"from {_MODEL_URL} if this environment has no outbound network access."
        )
        return False


class _PoseDetector:
    """Lazy singleton so the model is loaded once per process, not once per
    detection. Access is serialized via a lock — PoseLandmarker instances
    aren't documented as safe for concurrent calls from multiple threads,
    and main.py runs one thread per camera."""

    _instance = None
    _instance_lock = threading.Lock()
    _unavailable = False  # set True after a failed load, so we don't retry every call

    def __init__(self):
        base_options = BaseOptions(model_asset_path=MODEL_PATH)
        options = PoseLandmarkerOptions(
            base_options=base_options,
            running_mode=RunningMode.IMAGE,  # each call is an independent crop, not a video sequence
            num_poses=1,  # crop already isolates one tracked person
            min_pose_detection_confidence=0.5,
        )
        self.landmarker = PoseLandmarker.create_from_options(options)
        self.inference_lock = threading.Lock()

    @classmethod
    def instance(cls):
        """Returns a _PoseDetector, or None if mediapipe/the model are unavailable."""
        if cls._unavailable:
            return None
        if cls._instance is None:
            with cls._instance_lock:
                if cls._instance is None and not cls._unavailable:
                    if not _ensure_model_downloaded():
                        cls._unavailable = True
                        return None
                    try:
                        cls._instance = cls()
                    except Exception as e:
                        print(f"⚠️ Failed to initialize PoseLandmarker ({e}). Pose-based reach detection disabled.")
                        cls._unavailable = True
                        return None
        return cls._instance

    def process(self, crop_rgb: np.ndarray):
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=crop_rgb)
        with self.inference_lock:
            return self.landmarker.detect(mp_image)


def _angle_degrees(a, b, c) -> float:
    """Angle at point b, formed by rays b->a and b->c, in degrees."""
    a, b, c = np.array(a), np.array(b), np.array(c)
    ba, bc = a - b, c - b
    cos_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-10)
    return float(np.degrees(np.arccos(np.clip(cos_angle, -1.0, 1.0))))


def _arm_is_reaching(shoulder, elbow, wrist, shoulder_width) -> bool:
    if shoulder_width < 1e-6:
        return False
    angle = _angle_degrees(shoulder, elbow, wrist)
    displacement_ratio = abs(wrist[0] - shoulder[0]) / shoulder_width
    return angle >= MIN_ELBOW_EXTENSION_DEGREES and displacement_ratio >= MIN_WRIST_DISPLACEMENT_RATIO


def detect_reach(frame: np.ndarray, x1, y1, x2, y2) -> dict:
    """
    Runs pose estimation on a person's cropped bounding box and checks
    whether either arm is extended in a shelf-reach posture. Also returns a
    coarse head-facing signal reused by main.py's gaze estimator, computed
    from the same landmarks at no extra inference cost.

    Always returns a valid dict — {"pose_detected": bool, "reaching": bool,
    "facing_offset": float | None} — and never raises, so callers can use
    the result directly without a None-check on the dict itself.
    "pose_detected" tells you whether a pose was found at all (useful for
    deciding whether to trust "reaching": False as a real negative vs. "we
    simply couldn't see this person's joints"). "facing_offset" is the
    nose's horizontal offset from the shoulder midpoint, normalized by
    shoulder width — roughly, which way the head is turned relative to
    the torso. Positive = turned toward their right, negative = their left,
    None if the nose or either shoulder wasn't visible. This is NOT proper
    head-pose/gaze estimation (no pitch/yaw/roll, no eye direction) — it's a
    coarse left/right bias only, intended to sanity-check which side of the
    frame someone is plausibly facing, not to pinpoint a fixation target.
    """
    result = {"pose_detected": False, "reaching": False, "facing_offset": None}
    if not _MEDIAPIPE_AVAILABLE:
        return result

    detector = _PoseDetector.instance()
    if detector is None:
        return result

    crop = frame[max(0, int(y1)):int(y2), max(0, int(x1)):int(x2)]
    if crop.size == 0:
        return result

    try:
        crop_rgb = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)
        pose_result = detector.process(crop_rgb)
    except Exception as e:
        print(f"⚠️ Pose estimation failed ({e}) — treating this detection as no-reach.")
        return result

    if not pose_result.pose_landmarks:
        return result

    landmarks = pose_result.pose_landmarks[0]  # single pose (num_poses=1)
    result["pose_detected"] = True

    def visible(idx):
        v = landmarks[idx].visibility
        return v is None or v >= MIN_LANDMARK_VISIBILITY  # some builds leave visibility unset

    def pt(idx):
        return (landmarks[idx].x, landmarks[idx].y)

    if not (visible(LEFT_SHOULDER) and visible(RIGHT_SHOULDER)):
        return result  # can't establish shoulder width — no reliable reach/facing check possible

    shoulder_width = abs(landmarks[LEFT_SHOULDER].x - landmarks[RIGHT_SHOULDER].x)

    for shoulder_i, elbow_i, wrist_i in (
        (LEFT_SHOULDER, LEFT_ELBOW, LEFT_WRIST),
        (RIGHT_SHOULDER, RIGHT_ELBOW, RIGHT_WRIST),
    ):
        if visible(shoulder_i) and visible(elbow_i) and visible(wrist_i):
            if _arm_is_reaching(pt(shoulder_i), pt(elbow_i), pt(wrist_i), shoulder_width):
                result["reaching"] = True
                break

    if visible(NOSE) and shoulder_width > 1e-6:
        shoulder_mid_x = (landmarks[LEFT_SHOULDER].x + landmarks[RIGHT_SHOULDER].x) / 2
        result["facing_offset"] = (landmarks[NOSE].x - shoulder_mid_x) / shoulder_width

    return result
