from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

from app.ml.errors import MissingOptionalDependency
from app.ml.training import TrainingConfig, run_training


class _FakeYOLOModel:
    def __init__(self, _reference: str):
        self.trainer = SimpleNamespace(metrics={"fitness": 0.314})

    def train(self, **kwargs):
        run_directory = Path(kwargs["project"]) / kwargs["name"]
        (run_directory / "weights").mkdir(parents=True, exist_ok=True)
        (run_directory / "weights" / "best.pt").write_bytes(b"real-test-artifact")
        (run_directory / "results.csv").write_text(
            "epoch,metrics/mAP50(B),train/box_loss\n0,0.42,1.25\n",
            encoding="utf-8",
        )
        return SimpleNamespace(results_dict={"metrics/mAP50(B)": 0.42})


class TrainingRunTests(unittest.TestCase):
    def test_smoke_settings_are_bounded_and_record_both_configs(self) -> None:
        config = TrainingConfig(
            data="coco8.yaml",
            epochs=99,
            image_size=1280,
            batch_size=32,
            workers=8,
            patience=20,
            validate_dataset=False,
            smoke=True,
        )
        effective = config.effective()
        self.assertEqual(effective.epochs, 1)
        self.assertEqual(effective.image_size, 160)
        self.assertEqual(effective.batch_size, 2)
        self.assertEqual(effective.workers, 0)
        self.assertEqual(effective.patience, 0)

    def test_missing_ultralytics_writes_failed_truthful_record(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            config = TrainingConfig(
                data="coco8.yaml",
                project=Path(temporary),
                validate_dataset=False,
                smoke=True,
            )
            dependency_error = MissingOptionalDependency("install ultralytics and retry")
            with patch("app.ml.training.require_module", side_effect=dependency_error):
                with self.assertRaises(MissingOptionalDependency):
                    run_training(config)
            runs = list(Path(temporary).iterdir())
            self.assertEqual(len(runs), 1)
            record = json.loads((runs[0] / "run.json").read_text(encoding="utf-8"))
            self.assertEqual(record["status"], "failed")
            self.assertEqual(record["metrics"], {})
            self.assertEqual(record["artifacts"], [])
            self.assertEqual(record["error"]["type"], "MissingOptionalDependency")
            self.assertEqual(record["effective_config"]["epochs"], 1)

    def test_observed_metrics_and_artifacts_are_persisted(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            config = TrainingConfig(
                data="coco8.yaml",
                project=Path(temporary),
                validate_dataset=False,
                epochs=1,
            )
            fake_ultralytics = SimpleNamespace(YOLO=_FakeYOLOModel)
            with patch("app.ml.training.require_module", return_value=fake_ultralytics):
                outcome = run_training(config)
            record = json.loads(outcome.record_path.read_text(encoding="utf-8"))
            self.assertEqual(record["status"], "completed")
            self.assertEqual(record["metrics"]["result.metrics/mAP50(B)"], 0.42)
            self.assertEqual(record["metrics"]["results_csv.train/box_loss"], 1.25)
            models = [artifact for artifact in record["artifacts"] if artifact["kind"] == "model"]
            self.assertEqual(len(models), 1)
            self.assertEqual(models[0]["relative_path"], "weights/best.pt")
            self.assertEqual(len(models[0]["sha256"]), 64)


if __name__ == "__main__":
    unittest.main()
