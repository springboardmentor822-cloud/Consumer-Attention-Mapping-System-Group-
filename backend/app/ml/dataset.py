"""YOLO detection-dataset validation and reproducible manifest generation."""

from __future__ import annotations

import hashlib
import json
import math
from collections import Counter
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.ml.errors import DatasetValidationError, MLConfigurationError
from app.ml.optional import require_module

IMAGE_EXTENSIONS = frozenset({".bmp", ".jpeg", ".jpg", ".png", ".tif", ".tiff", ".webp"})


@dataclass(frozen=True)
class ValidationIssue:
    severity: str
    code: str
    message: str
    path: str | None = None
    line: int | None = None


@dataclass(frozen=True)
class SplitSummary:
    split: str
    image_count: int
    labeled_image_count: int
    empty_label_count: int
    annotation_count: int
    orphan_label_count: int


@dataclass(frozen=True)
class DatasetManifest:
    schema_version: int
    created_at: str
    dataset_root: str
    class_names: tuple[str, ...]
    dataset_sha256: str
    splits: tuple[SplitSummary, ...]
    total_images: int
    total_labeled_images: int
    total_annotations: int
    class_distribution: dict[str, int]

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class DatasetValidationReport:
    manifest: DatasetManifest
    issues: tuple[ValidationIssue, ...]

    @property
    def valid(self) -> bool:
        return not any(issue.severity == "error" for issue in self.issues)

    @property
    def error_count(self) -> int:
        return sum(issue.severity == "error" for issue in self.issues)

    @property
    def warning_count(self) -> int:
        return sum(issue.severity == "warning" for issue in self.issues)

    def raise_for_errors(self) -> None:
        if self.valid:
            return
        examples = []
        for issue in self.issues:
            if issue.severity != "error":
                continue
            location = issue.path or "dataset"
            if issue.line is not None:
                location += f":{issue.line}"
            examples.append(f"{location}: {issue.message}")
            if len(examples) == 5:
                break
        raise DatasetValidationError(
            f"Dataset validation failed with {self.error_count} error(s). " + " | ".join(examples)
        )

    def to_dict(self) -> dict[str, Any]:
        return {
            "valid": self.valid,
            "error_count": self.error_count,
            "warning_count": self.warning_count,
            "manifest": self.manifest.to_dict(),
            "issues": [asdict(issue) for issue in self.issues],
        }


class YoloDatasetValidator:
    """Validate standard YOLO detection labels without loading all data into RAM."""

    def __init__(
        self,
        dataset_root: str | Path,
        class_names: list[str] | tuple[str, ...],
        *,
        splits: tuple[str, ...] = ("train", "val"),
        image_directories: dict[str, str | Path] | None = None,
        label_directories: dict[str, str | Path] | None = None,
        require_labels: bool = True,
        verify_images: bool = False,
    ):
        self.dataset_root = Path(dataset_root).expanduser().resolve()
        self.class_names = tuple(str(name) for name in class_names)
        if not self.class_names or any(not name.strip() for name in self.class_names):
            raise MLConfigurationError("At least one non-empty class name is required.")
        if len(set(self.class_names)) != len(self.class_names):
            raise MLConfigurationError("YOLO class names must be unique.")
        if not splits:
            raise MLConfigurationError("At least one dataset split is required.")

        self.splits = tuple(splits)
        self.require_labels = require_labels
        self.verify_images = verify_images
        self.image_directories = {
            split: self._resolve_directory(
                (image_directories or {}).get(split, self.dataset_root / "images" / split)
            )
            for split in self.splits
        }
        self.label_directories = {
            split: self._resolve_directory(
                (label_directories or {}).get(split, self.dataset_root / "labels" / split)
            )
            for split in self.splits
        }

    def _resolve_directory(self, value: str | Path) -> Path:
        path = Path(value).expanduser()
        if not path.is_absolute():
            path = self.dataset_root / path
        return path.resolve()

    @classmethod
    def from_yaml(
        cls,
        yaml_path: str | Path,
        *,
        splits: tuple[str, ...] = ("train", "val"),
        require_labels: bool = True,
        verify_images: bool = False,
    ) -> "YoloDatasetValidator":
        yaml = require_module(
            "yaml",
            purpose="Reading a YOLO dataset YAML file",
            pip_name="PyYAML",
        )
        config_path = Path(yaml_path).expanduser().resolve()
        if not config_path.is_file():
            raise FileNotFoundError(f"YOLO dataset YAML does not exist: {config_path}")
        payload = yaml.safe_load(config_path.read_text(encoding="utf-8"))
        if not isinstance(payload, dict):
            raise MLConfigurationError(f"Dataset YAML must contain a mapping: {config_path}")

        root_value = payload.get("path", ".")
        root = Path(str(root_value)).expanduser()
        if not root.is_absolute():
            root = config_path.parent / root
        root = root.resolve()

        names = payload.get("names")
        if isinstance(names, list):
            class_names = [str(name) for name in names]
        elif isinstance(names, dict):
            try:
                ordered_keys = sorted(names, key=lambda key: int(key))
                expected = list(range(len(ordered_keys)))
                actual = [int(key) for key in ordered_keys]
            except (TypeError, ValueError) as exc:
                raise MLConfigurationError("Dataset YAML class keys must be integer IDs.") from exc
            if actual != expected:
                raise MLConfigurationError("Dataset YAML class IDs must be contiguous and start at 0.")
            class_names = [str(names[key]) for key in ordered_keys]
        else:
            raise MLConfigurationError("Dataset YAML must define `names` as a list or ID-to-name mapping.")

        image_directories: dict[str, Path] = {}
        label_directories: dict[str, Path] = {}
        for split in splits:
            split_value = payload.get(split)
            if not isinstance(split_value, str):
                raise MLConfigurationError(
                    f"Dataset YAML `{split}` must be one directory path; lists and file lists are not supported."
                )
            image_dir = Path(split_value).expanduser()
            if not image_dir.is_absolute():
                image_dir = root / image_dir
            image_dir = image_dir.resolve()
            image_directories[split] = image_dir
            label_directories[split] = _derive_label_directory(root, image_dir, split)

        return cls(
            root,
            class_names,
            splits=splits,
            image_directories=image_directories,
            label_directories=label_directories,
            require_labels=require_labels,
            verify_images=verify_images,
        )

    def validate(self) -> DatasetValidationReport:
        issues: list[ValidationIssue] = []
        summaries: list[SplitSummary] = []
        class_counts: Counter[int] = Counter()
        files_for_digest: set[Path] = set()
        cv2 = None
        if self.verify_images:
            cv2 = require_module(
                "cv2",
                purpose="Decoding images during dataset validation",
                pip_name="opencv-python-headless",
            )

        for split in self.splits:
            image_dir = self.image_directories[split]
            label_dir = self.label_directories[split]
            if not image_dir.is_dir():
                issues.append(
                    ValidationIssue("error", "missing_image_directory", f"Missing image directory for `{split}`.", str(image_dir))
                )
                summaries.append(SplitSummary(split, 0, 0, 0, 0, 0))
                continue

            images = sorted(
                path for path in image_dir.rglob("*") if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS
            )
            if not images:
                issues.append(
                    ValidationIssue("error", "empty_image_split", f"No supported images found in `{split}`.", str(image_dir))
                )

            expected_labels: set[Path] = set()
            labeled_images = 0
            empty_labels = 0
            annotations = 0

            for image_path in images:
                files_for_digest.add(image_path)
                relative = image_path.relative_to(image_dir)
                label_path = (label_dir / relative).with_suffix(".txt")
                expected_labels.add(label_path.resolve())

                if cv2 is not None and cv2.imread(str(image_path)) is None:
                    issues.append(
                        ValidationIssue("error", "unreadable_image", "OpenCV could not decode this image.", str(image_path))
                    )

                if not label_path.is_file():
                    severity = "error" if self.require_labels else "warning"
                    issues.append(
                        ValidationIssue(severity, "missing_label", "Image has no matching YOLO label file.", str(label_path))
                    )
                    continue

                labeled_images += 1
                files_for_digest.add(label_path)
                label_annotations, is_empty = self._validate_label(label_path, issues, class_counts)
                annotations += label_annotations
                empty_labels += int(is_empty)

            orphan_labels = 0
            if label_dir.is_dir():
                for label_path in label_dir.rglob("*.txt"):
                    if label_path.resolve() not in expected_labels:
                        orphan_labels += 1
                        files_for_digest.add(label_path)
                        issues.append(
                            ValidationIssue(
                                "warning",
                                "orphan_label",
                                "Label file has no matching supported image.",
                                str(label_path),
                            )
                        )

            summaries.append(
                SplitSummary(
                    split=split,
                    image_count=len(images),
                    labeled_image_count=labeled_images,
                    empty_label_count=empty_labels,
                    annotation_count=annotations,
                    orphan_label_count=orphan_labels,
                )
            )

        manifest = DatasetManifest(
            schema_version=1,
            created_at=datetime.now(timezone.utc).isoformat(),
            dataset_root=str(self.dataset_root),
            class_names=self.class_names,
            dataset_sha256=_dataset_digest(self.dataset_root, files_for_digest),
            splits=tuple(summaries),
            total_images=sum(summary.image_count for summary in summaries),
            total_labeled_images=sum(summary.labeled_image_count for summary in summaries),
            total_annotations=sum(summary.annotation_count for summary in summaries),
            class_distribution={
                self.class_names[class_id]: class_counts.get(class_id, 0)
                for class_id in range(len(self.class_names))
            },
        )
        return DatasetValidationReport(manifest=manifest, issues=tuple(issues))

    def _validate_label(
        self,
        label_path: Path,
        issues: list[ValidationIssue],
        class_counts: Counter[int],
    ) -> tuple[int, bool]:
        try:
            raw_lines = label_path.read_text(encoding="utf-8").splitlines()
        except UnicodeDecodeError:
            issues.append(
                ValidationIssue("error", "invalid_label_encoding", "Label must be UTF-8 text.", str(label_path))
            )
            return 0, False

        nonempty_lines = [(line_number, line.strip()) for line_number, line in enumerate(raw_lines, 1) if line.strip()]
        valid_annotations = 0
        for line_number, line in nonempty_lines:
            tokens = line.split()
            if len(tokens) != 5:
                issues.append(
                    ValidationIssue(
                        "error",
                        "invalid_label_columns",
                        "Detection labels require exactly: class x_center y_center width height.",
                        str(label_path),
                        line_number,
                    )
                )
                continue
            try:
                class_id = int(tokens[0])
                coordinates = [float(value) for value in tokens[1:]]
            except ValueError:
                issues.append(
                    ValidationIssue("error", "invalid_label_number", "Label contains a non-numeric value.", str(label_path), line_number)
                )
                continue
            if not all(math.isfinite(value) for value in coordinates):
                issues.append(
                    ValidationIssue("error", "non_finite_coordinate", "Coordinates must be finite.", str(label_path), line_number)
                )
                continue
            if class_id < 0 or class_id >= len(self.class_names):
                issues.append(
                    ValidationIssue(
                        "error",
                        "class_id_out_of_range",
                        f"Class ID {class_id} is outside [0, {len(self.class_names) - 1}].",
                        str(label_path),
                        line_number,
                    )
                )
                continue

            x_center, y_center, width, height = coordinates
            coordinate_error = None
            if not (0.0 <= x_center <= 1.0 and 0.0 <= y_center <= 1.0):
                coordinate_error = "Box centers must be normalized to [0, 1]."
            elif not (0.0 < width <= 1.0 and 0.0 < height <= 1.0):
                coordinate_error = "Box width and height must be normalized to (0, 1]."
            elif x_center - width / 2 < -1e-6 or x_center + width / 2 > 1.0 + 1e-6:
                coordinate_error = "Box extends beyond the image horizontally."
            elif y_center - height / 2 < -1e-6 or y_center + height / 2 > 1.0 + 1e-6:
                coordinate_error = "Box extends beyond the image vertically."
            if coordinate_error:
                issues.append(
                    ValidationIssue("error", "invalid_box", coordinate_error, str(label_path), line_number)
                )
                continue

            class_counts[class_id] += 1
            valid_annotations += 1

        return valid_annotations, not nonempty_lines


def _derive_label_directory(root: Path, image_dir: Path, split: str) -> Path:
    try:
        relative = image_dir.relative_to(root)
    except ValueError:
        return (root / "labels" / split).resolve()
    parts = list(relative.parts)
    if "images" in parts:
        parts[parts.index("images")] = "labels"
        return (root.joinpath(*parts)).resolve()
    return (root / "labels" / split).resolve()


def _dataset_digest(root: Path, files: set[Path]) -> str:
    digest = hashlib.sha256()
    for path in sorted(files, key=lambda item: item.as_posix().lower()):
        try:
            relative = path.resolve().relative_to(root).as_posix()
        except ValueError:
            relative = path.resolve().as_posix()
        digest.update(relative.encode("utf-8"))
        digest.update(b"\0")
        with path.open("rb") as handle:
            for chunk in iter(lambda: handle.read(1024 * 1024), b""):
                digest.update(chunk)
        digest.update(b"\0")
    return digest.hexdigest()


def write_manifest(report: DatasetValidationReport, output_path: str | Path) -> Path:
    """Atomically persist the complete validation result and content digest."""

    destination = Path(output_path).expanduser().resolve()
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = destination.with_suffix(destination.suffix + ".tmp")
    temporary.write_text(json.dumps(report.to_dict(), indent=2, sort_keys=True), encoding="utf-8")
    temporary.replace(destination)
    return destination


def write_dataset_yaml(
    output_path: str | Path,
    dataset_root: str | Path,
    class_names: list[str] | tuple[str, ...],
) -> Path:
    """Write a standard train/val detection YAML without requiring PyYAML."""

    destination = Path(output_path).expanduser().resolve()
    root = Path(dataset_root).expanduser().resolve()
    destination.parent.mkdir(parents=True, exist_ok=True)
    lines = [
        f"path: {json.dumps(root.as_posix())}",
        "train: images/train",
        "val: images/val",
        "names:",
    ]
    lines.extend(f"  {index}: {json.dumps(str(name))}" for index, name in enumerate(class_names))
    destination.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return destination


def create_tiny_smoke_dataset(
    destination: str | Path,
    *,
    class_name: str = "shopper",
    train_images: int = 2,
    val_images: int = 1,
    image_size: int = 160,
) -> Path:
    """Create a clearly marked synthetic YOLO dataset for one-epoch plumbing tests."""

    if train_images < 1 or val_images < 1 or image_size < 64:
        raise MLConfigurationError("Smoke data requires positive split sizes and image_size >= 64.")
    cv2 = require_module(
        "cv2",
        purpose="Creating the synthetic YOLO smoke dataset",
        pip_name="opencv-python-headless",
    )
    np = require_module("numpy", purpose="Creating the synthetic YOLO smoke dataset")
    root = Path(destination).expanduser().resolve()
    if root.exists() and any(root.iterdir()):
        raise MLConfigurationError(f"Refusing to overwrite non-empty smoke dataset directory: {root}")

    for split, count in (("train", train_images), ("val", val_images)):
        image_dir = root / "images" / split
        label_dir = root / "labels" / split
        image_dir.mkdir(parents=True, exist_ok=True)
        label_dir.mkdir(parents=True, exist_ok=True)
        for index in range(count):
            image = np.full((image_size, image_size, 3), 28, dtype=np.uint8)
            box_width = image_size // 3
            box_height = image_size // 2
            x1 = image_size // 4 + (index % 2) * 4
            y1 = image_size // 4
            x2 = x1 + box_width
            y2 = y1 + box_height
            cv2.rectangle(image, (x1, y1), (x2, y2), (50, 200, 160), -1)
            image_path = image_dir / f"synthetic_{split}_{index:03d}.jpg"
            if not cv2.imwrite(str(image_path), image):
                raise MLConfigurationError(f"OpenCV failed to write smoke image: {image_path}")
            x_center = ((x1 + x2) / 2) / image_size
            y_center = ((y1 + y2) / 2) / image_size
            width = (x2 - x1) / image_size
            height = (y2 - y1) / image_size
            (label_dir / f"synthetic_{split}_{index:03d}.txt").write_text(
                f"0 {x_center:.6f} {y_center:.6f} {width:.6f} {height:.6f}\n",
                encoding="utf-8",
            )

    return write_dataset_yaml(root / "dataset.yaml", root, [class_name])
