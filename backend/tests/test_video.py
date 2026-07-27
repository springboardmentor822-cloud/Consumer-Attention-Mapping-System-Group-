from __future__ import annotations

import importlib.util
import tempfile
import unittest
from pathlib import Path

from app.ml.video import (
    AugmentationConfig,
    FrameAugmenter,
    ResizeSpec,
    VideoFrameIterator,
    batch_frames,
)

HAS_VIDEO_DEPS = importlib.util.find_spec("cv2") is not None and importlib.util.find_spec("numpy") is not None


@unittest.skipUnless(HAS_VIDEO_DEPS, "OpenCV and NumPy are optional video-test dependencies")
class VideoIteratorTests(unittest.TestCase):
    def test_stride_resize_and_bounded_batches(self) -> None:
        import cv2
        import numpy as np

        with tempfile.TemporaryDirectory() as temporary:
            path = Path(temporary) / "frames.avi"
            writer = cv2.VideoWriter(str(path), cv2.VideoWriter_fourcc(*"MJPG"), 10.0, (32, 24))
            if not writer.isOpened():
                self.skipTest("MJPG video writer is unavailable")
            for index in range(6):
                writer.write(np.full((24, 32, 3), index * 20, dtype=np.uint8))
            writer.release()

            frames = VideoFrameIterator(
                path,
                resize=ResizeSpec(16, 16),
                stride=2,
                max_frames=3,
            )
            batches = list(batch_frames(frames, 2))
            self.assertEqual([len(batch) for batch in batches], [2, 1])
            self.assertEqual(batches[0].images.shape, (2, 16, 16, 3))
            self.assertEqual(batches[0].source_indices, (0, 2))
            self.assertEqual(batches[1].source_indices, (4,))

    def test_deterministic_horizontal_flip(self) -> None:
        import numpy as np

        image = np.array([[[1], [2], [3]]], dtype=np.uint8)
        augmenter = FrameAugmenter(AugmentationConfig(horizontal_flip_probability=1.0, seed=7))
        output = augmenter(image)
        self.assertEqual(output.reshape(-1).tolist(), [3, 2, 1])


if __name__ == "__main__":
    unittest.main()
