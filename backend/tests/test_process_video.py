from __future__ import annotations

import json
import os
import unittest
from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import patch

from app.ml.inference import Detection, TrackedFrame
from app.ml.video import VideoFrame
from scripts.process_video import (
    APIIngestError,
    TrackingIngestClient,
    WorkerConfig,
    WorkerRunError,
    parse_classes,
    resolve_token,
    run_worker,
)


class _Image:
    shape = (100, 200, 3)


class _Tracker:
    def __init__(self, detections_by_frame):
        self.detections_by_frame = iter(detections_by_frame)
        self.calls = []

    def process_frame(self, image, *, timestamp_seconds, frame_index):
        self.calls.append((image, timestamp_seconds, frame_index))
        return TrackedFrame(frame_index, timestamp_seconds, tuple(next(self.detections_by_frame)))


class _Client:
    def __init__(self, failure: Exception | None = None):
        self.failure = failure
        self.batches = []

    def post_batch(self, store_id, observations):
        self.batches.append((store_id, list(observations)))
        if self.failure is not None:
            raise self.failure
        return {
            "store_id": store_id,
            "accepted": len(observations),
            "stream_backend": "test",
            "message_ids": [f"message-{index}" for index in range(len(observations))],
        }


def _detection(track_id: int | None) -> Detection:
    return Detection(
        track_id=track_id,
        class_id=0,
        class_name="person",
        confidence=0.91,
        bbox_xyxy=(20.0, 10.0, 100.0, 50.0),
    )


def _frames(count: int):
    return [
        VideoFrame(source_index=index * 2, timestamp_seconds=index / 10, image=_Image(), original_shape=(100, 200, 3))
        for index in range(count)
    ]


def _config() -> WorkerConfig:
    return WorkerConfig(
        source="unused.mp4",
        model="unused.pt",
        store_id=4,
        camera_id=9,
        zone_id=3,
        api_base="http://localhost:8000/api",
        token="test-token",
    )


class VideoWorkerTests(unittest.TestCase):
    def test_normalizes_and_never_batches_more_than_one_hundred(self) -> None:
        detections = [
            [_detection(index + 1) for index in range(70)],
            [_detection(index + 71) for index in range(70)],
            [_detection(index + 141) for index in range(65)],
        ]
        tracker = _Tracker(detections)
        client = _Client()
        clock_values = iter((10.0, 12.0))
        summary = run_worker(
            _config(),
            frames=_frames(3),
            tracker=tracker,
            client=client,
            monotonic=lambda: next(clock_values),
            utcnow=lambda: datetime(2026, 7, 14, 5, 0, tzinfo=timezone.utc),
        )

        self.assertEqual([len(batch) for _, batch in client.batches], [100, 100, 5])
        self.assertEqual(summary["frames"], 3)
        self.assertEqual(summary["fps"], 1.5)
        self.assertEqual(summary["detections"], 205)
        self.assertEqual(summary["accepted"], 205)
        self.assertEqual(summary["failed"], 0)
        first = client.batches[0][1][0]
        self.assertEqual(first["tracker_id"], "camera:9:track:1")
        self.assertEqual(first["frame_index"], 0)
        self.assertEqual(first["bbox_x1"], 10.0)
        self.assertEqual(first["bbox_y1"], 10.0)
        self.assertEqual(first["bbox_x2"], 50.0)
        self.assertEqual(first["bbox_y2"], 50.0)
        self.assertEqual(first["x_position"], 30.0)
        self.assertEqual(first["y_position"], 30.0)

    def test_untracked_detection_is_skipped_not_fabricated(self) -> None:
        client = _Client()
        clock_values = iter((1.0, 2.0))
        summary = run_worker(
            _config(),
            frames=_frames(1),
            tracker=_Tracker([[_detection(None)]]),
            client=client,
            monotonic=lambda: next(clock_values),
        )
        self.assertEqual(summary["detections"], 1)
        self.assertEqual(summary["skipped_untracked"], 1)
        self.assertEqual(summary["observations_prepared"], 0)
        self.assertEqual(summary["accepted"], 0)
        self.assertEqual(client.batches, [])

    def test_api_failure_reports_unconfirmed_batch_and_stops(self) -> None:
        client = _Client(APIIngestError("HTTP 401: invalid token"))
        clock_values = iter((1.0, 3.0))
        with self.assertRaises(WorkerRunError) as raised:
            run_worker(
                _config(),
                frames=_frames(1),
                tracker=_Tracker([[_detection(8)]]),
                client=client,
                monotonic=lambda: next(clock_values),
            )
        summary = raised.exception.summary
        self.assertEqual(summary["status"], "failed")
        self.assertEqual(summary["detections"], 1)
        self.assertEqual(summary["accepted"], 0)
        self.assertEqual(summary["failed"], 1)
        self.assertIn("401", summary["error"])


class HTTPClientTests(unittest.TestCase):
    def test_bearer_request_and_response_contract(self) -> None:
        captured = {}

        class Response:
            status = 200

            def __enter__(self):
                return self

            def __exit__(self, *_args):
                return False

            def read(self):
                return json.dumps(
                    {
                        "store_id": 4,
                        "accepted": 2,
                        "stream_backend": "memory",
                        "message_ids": ["a", "b"],
                    }
                ).encode("utf-8")

        def opener(request, *, timeout):
            captured["request"] = request
            captured["timeout"] = timeout
            return Response()

        client = TrackingIngestClient("http://localhost:8000/api/", "secret", timeout_seconds=7, opener=opener)
        response = client.post_batch(4, [{"tracker_id": "one"}, {"tracker_id": "two"}])
        request = captured["request"]
        self.assertEqual(request.full_url, "http://localhost:8000/api/stores/4/tracking/ingest")
        self.assertEqual(request.get_header("Authorization"), "Bearer secret")
        self.assertEqual(captured["timeout"], 7)
        body = json.loads(request.data.decode("utf-8"))
        self.assertEqual(body["store_id"], 4)
        self.assertEqual(len(body["observations"]), 2)
        self.assertEqual(response["accepted"], 2)

    def test_token_env_and_class_parsing(self) -> None:
        with patch.dict(os.environ, {"WORKER_TOKEN": " env-token "}, clear=False):
            self.assertEqual(resolve_token(None, "WORKER_TOKEN"), "env-token")
        self.assertEqual(parse_classes("0, 2,2,5"), (0, 2, 5))


if __name__ == "__main__":
    unittest.main()
