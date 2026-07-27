from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from app.ml.inference import YOLOByteTracker, write_tracks_jsonl


class _TensorLike:
    def __init__(self, value):
        self.value = value

    def detach(self):
        return self

    def cpu(self):
        return self

    def tolist(self):
        return self.value


class _FakeBoxes:
    xyxy = _TensorLike([[10, 20, 30, 60]])
    conf = _TensorLike([0.93])
    cls = _TensorLike([0])
    id = _TensorLike([17])


class _FakeResult:
    boxes = _FakeBoxes()
    names = {0: "person"}


class _FakeModel:
    names = {0: "person"}

    def __init__(self):
        self.calls = []

    def track(self, **kwargs):
        self.calls.append(kwargs)
        return [_FakeResult()]


class InferenceWrapperTests(unittest.TestCase):
    def test_model_and_bytetrack_state_are_reused(self) -> None:
        models = []

        def factory(_reference):
            model = _FakeModel()
            models.append(model)
            return model

        tracker = YOLOByteTracker("fake.pt", model_factory=factory)
        first = tracker.process_frame("frame-a", timestamp_seconds=0.1)
        second = tracker.process_frame("frame-b", timestamp_seconds=0.2)
        self.assertEqual(len(models), 1)
        self.assertEqual(len(models[0].calls), 2)
        self.assertTrue(models[0].calls[0]["persist"])
        self.assertEqual(models[0].calls[0]["tracker"], "bytetrack.yaml")
        self.assertEqual(first.detections[0].track_id, 17)
        self.assertEqual(first.detections[0].center_xy, (20.0, 40.0))
        self.assertEqual(second.frame_index, 1)

        tracker.reset()
        tracker.process_frame("frame-c")
        self.assertEqual(len(models), 2)

    def test_jsonl_output_is_streamed(self) -> None:
        tracker = YOLOByteTracker("fake.pt", model_factory=lambda _reference: _FakeModel())
        frames = (tracker.process_frame(f"frame-{index}") for index in range(2))
        with tempfile.TemporaryDirectory() as temporary:
            destination = write_tracks_jsonl(frames, Path(temporary) / "tracks.jsonl")
            rows = [json.loads(line) for line in destination.read_text(encoding="utf-8").splitlines()]
            self.assertEqual(len(rows), 2)
            self.assertEqual(rows[0]["detections"][0]["class_name"], "person")


if __name__ == "__main__":
    unittest.main()
