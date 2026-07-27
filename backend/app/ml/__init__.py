"""Optional computer-vision and training primitives for attention mapping.

Importing this package never imports PyTorch, Ultralytics, NumPy, or OpenCV.
Heavy dependencies are loaded only when the corresponding feature is invoked.
"""

from app.ml.attention import (
    DwellEvent,
    DwellEventKind,
    DwellEventStateMachine,
    DwellObservation,
    GazeHit,
    ShelfPlane,
    gaze_vector_from_head_pose,
    map_gaze_to_shelf,
    ray_plane_intersection,
)
from app.ml.dataset import (
    DatasetManifest,
    DatasetValidationReport,
    YoloDatasetValidator,
    create_tiny_smoke_dataset,
    write_manifest,
)
from app.ml.errors import DatasetValidationError, MLConfigurationError, MLError, MissingOptionalDependency
from app.ml.inference import Detection, TrackedFrame, YOLOByteTracker, write_tracks_jsonl
from app.ml.training import TrainingConfig, TrainingOutcome, run_training
from app.ml.video import (
    AugmentationConfig,
    FrameAugmenter,
    FrameBatch,
    ResizeSpec,
    VideoFrame,
    VideoFrameIterator,
    batch_frames,
    resize_frame,
)

__all__ = [
    "AugmentationConfig",
    "DatasetManifest",
    "DatasetValidationError",
    "DatasetValidationReport",
    "Detection",
    "DwellEvent",
    "DwellEventKind",
    "DwellEventStateMachine",
    "DwellObservation",
    "FrameAugmenter",
    "FrameBatch",
    "GazeHit",
    "MLConfigurationError",
    "MLError",
    "MissingOptionalDependency",
    "ResizeSpec",
    "ShelfPlane",
    "TrackedFrame",
    "TrainingConfig",
    "TrainingOutcome",
    "VideoFrame",
    "VideoFrameIterator",
    "YOLOByteTracker",
    "YoloDatasetValidator",
    "batch_frames",
    "create_tiny_smoke_dataset",
    "gaze_vector_from_head_pose",
    "map_gaze_to_shelf",
    "ray_plane_intersection",
    "resize_frame",
    "run_training",
    "write_manifest",
    "write_tracks_jsonl",
]
