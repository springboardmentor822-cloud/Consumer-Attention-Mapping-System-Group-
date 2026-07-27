"""Memory-bounded OpenCV video decoding, resizing, augmentation, and batching."""

from __future__ import annotations

from collections.abc import Callable, Iterable, Iterator
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from app.ml.errors import MLConfigurationError
from app.ml.optional import require_module


def _opencv() -> Any:
    return require_module(
        "cv2",
        purpose="Video decoding and image preprocessing",
        pip_name="opencv-python-headless",
    )


def _numpy() -> Any:
    return require_module("numpy", purpose="Video batching and augmentation")


@dataclass(frozen=True)
class ResizeSpec:
    """Target frame size. ``keep_aspect`` uses YOLO-style letterboxing."""

    width: int
    height: int
    keep_aspect: bool = True
    pad_value: int = 114

    def __post_init__(self) -> None:
        if self.width < 1 or self.height < 1:
            raise MLConfigurationError("Resize width and height must be positive integers.")
        if not 0 <= self.pad_value <= 255:
            raise MLConfigurationError("Resize pad_value must be between 0 and 255.")


@dataclass(frozen=True)
class AugmentationConfig:
    """Small frame-only augmentations suitable for smoke tests and preprocessing.

    These transforms do not update bounding-box labels. For labeled YOLO training,
    use Ultralytics' label-aware augmentations inside the trainer.
    """

    horizontal_flip_probability: float = 0.0
    brightness_delta: float = 0.0
    contrast_range: tuple[float, float] = (1.0, 1.0)
    gaussian_noise_std: float = 0.0
    seed: int = 0

    def __post_init__(self) -> None:
        if not 0.0 <= self.horizontal_flip_probability <= 1.0:
            raise MLConfigurationError("horizontal_flip_probability must be in [0, 1].")
        if self.brightness_delta < 0:
            raise MLConfigurationError("brightness_delta cannot be negative.")
        low, high = self.contrast_range
        if low <= 0 or high < low:
            raise MLConfigurationError("contrast_range must contain positive ordered values.")
        if self.gaussian_noise_std < 0:
            raise MLConfigurationError("gaussian_noise_std cannot be negative.")


class FrameAugmenter:
    """Deterministic, one-frame-at-a-time augmentation callable."""

    def __init__(self, config: AugmentationConfig):
        self.config = config
        self._np = _numpy()
        self._rng = self._np.random.default_rng(config.seed)

    def __call__(self, image: Any) -> Any:
        np = self._np
        output = image
        if self._rng.random() < self.config.horizontal_flip_probability:
            output = output[:, ::-1]

        contrast = self._rng.uniform(*self.config.contrast_range)
        brightness = self._rng.uniform(-self.config.brightness_delta, self.config.brightness_delta)
        if contrast != 1.0 or brightness != 0.0:
            output = np.clip(output.astype(np.float32) * contrast + brightness, 0, 255).astype(np.uint8)

        if self.config.gaussian_noise_std > 0:
            noise = self._rng.normal(0.0, self.config.gaussian_noise_std, output.shape)
            output = np.clip(output.astype(np.float32) + noise, 0, 255).astype(np.uint8)

        return np.ascontiguousarray(output)


@dataclass(frozen=True)
class VideoFrame:
    source_index: int
    timestamp_seconds: float
    image: Any
    original_shape: tuple[int, ...]


@dataclass(frozen=True)
class FrameBatch:
    """A bounded batch. Its first dimension never exceeds ``batch_size``."""

    images: Any
    source_indices: tuple[int, ...]
    timestamps_seconds: tuple[float, ...]
    original_shapes: tuple[tuple[int, ...], ...]

    def __len__(self) -> int:
        return len(self.source_indices)


def resize_frame(image: Any, spec: ResizeSpec) -> Any:
    cv2 = _opencv()
    np = _numpy()
    source_height, source_width = image.shape[:2]
    if source_width < 1 or source_height < 1:
        raise MLConfigurationError("Cannot resize an empty frame.")

    if not spec.keep_aspect:
        return cv2.resize(image, (spec.width, spec.height), interpolation=cv2.INTER_LINEAR)

    scale = min(spec.width / source_width, spec.height / source_height)
    resized_width = max(1, int(round(source_width * scale)))
    resized_height = max(1, int(round(source_height * scale)))
    interpolation = cv2.INTER_AREA if scale < 1 else cv2.INTER_LINEAR
    resized = cv2.resize(image, (resized_width, resized_height), interpolation=interpolation)
    canvas_shape = (spec.height, spec.width, *image.shape[2:])
    canvas = np.full(canvas_shape, spec.pad_value, dtype=image.dtype)
    left = (spec.width - resized_width) // 2
    top = (spec.height - resized_height) // 2
    canvas[top : top + resized_height, left : left + resized_width] = resized
    return canvas


class VideoFrameIterator:
    """Decode a video lazily while retaining at most one decoded frame.

    A new ``VideoCapture`` is opened for every iteration and always released,
    including when the consumer stops early.
    """

    def __init__(
        self,
        source: str | Path | int,
        *,
        resize: ResizeSpec | None = None,
        augmenter: Callable[[Any], Any] | None = None,
        stride: int = 1,
        start_frame: int = 0,
        end_frame: int | None = None,
        max_frames: int | None = None,
        convert_bgr_to_rgb: bool = False,
    ):
        if stride < 1:
            raise MLConfigurationError("stride must be at least 1.")
        if start_frame < 0:
            raise MLConfigurationError("start_frame cannot be negative.")
        if end_frame is not None and end_frame <= start_frame:
            raise MLConfigurationError("end_frame must be greater than start_frame.")
        if max_frames is not None and max_frames < 1:
            raise MLConfigurationError("max_frames must be positive when supplied.")

        self.source = source
        self.resize = resize
        self.augmenter = augmenter
        self.stride = stride
        self.start_frame = start_frame
        self.end_frame = end_frame
        self.max_frames = max_frames
        self.convert_bgr_to_rgb = convert_bgr_to_rgb

    def _capture_source(self) -> str | int:
        if isinstance(self.source, int):
            return self.source
        value = str(self.source).strip()
        if value.isdigit():
            return int(value)
        if "://" not in value and not Path(value).is_file():
            raise FileNotFoundError(f"Video source does not exist: {Path(value).resolve()}")
        return value

    def __iter__(self) -> Iterator[VideoFrame]:
        cv2 = _opencv()
        capture = cv2.VideoCapture(self._capture_source())
        if not capture.isOpened():
            capture.release()
            raise MLConfigurationError(f"OpenCV could not open video source: {self.source}")

        yielded = 0
        source_index = self.start_frame
        if self.start_frame:
            capture.set(cv2.CAP_PROP_POS_FRAMES, self.start_frame)

        try:
            while self.end_frame is None or source_index < self.end_frame:
                ok, image = capture.read()
                if not ok:
                    break

                current_index = source_index
                source_index += 1
                if (current_index - self.start_frame) % self.stride:
                    continue

                original_shape = tuple(int(value) for value in image.shape)
                if self.resize is not None:
                    image = resize_frame(image, self.resize)
                if self.augmenter is not None:
                    image = self.augmenter(image)
                if self.convert_bgr_to_rgb:
                    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

                timestamp_ms = float(capture.get(cv2.CAP_PROP_POS_MSEC) or 0.0)
                yield VideoFrame(
                    source_index=current_index,
                    timestamp_seconds=max(0.0, timestamp_ms / 1000.0),
                    image=image,
                    original_shape=original_shape,
                )
                yielded += 1
                if self.max_frames is not None and yielded >= self.max_frames:
                    break
        finally:
            capture.release()


def batch_frames(frames: Iterable[VideoFrame], batch_size: int) -> Iterator[FrameBatch]:
    """Stack frames into bounded batches and release each list after yielding."""

    if batch_size < 1:
        raise MLConfigurationError("batch_size must be at least 1.")
    np = _numpy()
    pending: list[VideoFrame] = []
    for frame in frames:
        pending.append(frame)
        if len(pending) == batch_size:
            yield _stack_batch(np, pending)
            pending = []
    if pending:
        yield _stack_batch(np, pending)


def _stack_batch(np: Any, frames: list[VideoFrame]) -> FrameBatch:
    shapes = {tuple(frame.image.shape) for frame in frames}
    if len(shapes) != 1:
        raise MLConfigurationError(
            "Frames have different shapes and cannot be stacked. Supply a ResizeSpec before batching."
        )
    return FrameBatch(
        images=np.stack([frame.image for frame in frames], axis=0),
        source_indices=tuple(frame.source_index for frame in frames),
        timestamps_seconds=tuple(frame.timestamp_seconds for frame in frames),
        original_shapes=tuple(frame.original_shape for frame in frames),
    )
