from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from app.ml.dataset import YoloDatasetValidator, write_dataset_yaml, write_manifest
from app.ml.errors import DatasetValidationError


class DatasetValidationTests(unittest.TestCase):
    def _dataset_root(self, temporary: str) -> Path:
        root = Path(temporary) / "retail"
        for split in ("train", "val"):
            (root / "images" / split).mkdir(parents=True)
            (root / "labels" / split).mkdir(parents=True)
            (root / "images" / split / f"{split}.jpg").write_bytes(b"image-placeholder")
            (root / "labels" / split / f"{split}.txt").write_text(
                "0 0.5 0.5 0.4 0.6\n", encoding="utf-8"
            )
        return root

    def test_valid_dataset_manifest_and_digest(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = self._dataset_root(temporary)
            report = YoloDatasetValidator(root, ["shopper"]).validate()
            self.assertTrue(report.valid)
            self.assertEqual(report.manifest.total_images, 2)
            self.assertEqual(report.manifest.total_annotations, 2)
            self.assertEqual(report.manifest.class_distribution, {"shopper": 2})
            self.assertEqual(len(report.manifest.dataset_sha256), 64)

            destination = write_manifest(report, root / "manifest.json")
            payload = json.loads(destination.read_text(encoding="utf-8"))
            self.assertTrue(payload["valid"])
            self.assertEqual(payload["manifest"]["dataset_sha256"], report.manifest.dataset_sha256)

    def test_invalid_class_and_box_report_exact_lines(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = self._dataset_root(temporary)
            label = root / "labels" / "train" / "train.txt"
            label.write_text("3 0.5 0.5 0.4 0.4\n0 0.95 0.5 0.2 0.2\n", encoding="utf-8")
            report = YoloDatasetValidator(root, ["shopper"]).validate()
            self.assertFalse(report.valid)
            self.assertEqual(report.error_count, 2)
            self.assertEqual([issue.line for issue in report.issues if issue.severity == "error"], [1, 2])
            with self.assertRaises(DatasetValidationError):
                report.raise_for_errors()

    def test_directory_yaml_writer_uses_absolute_root(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = self._dataset_root(temporary)
            path = write_dataset_yaml(root / "dataset.yaml", root, ["shopper", "product"])
            text = path.read_text(encoding="utf-8")
            self.assertIn(root.resolve().as_posix(), text)
            self.assertIn('1: "product"', text)


if __name__ == "__main__":
    unittest.main()
