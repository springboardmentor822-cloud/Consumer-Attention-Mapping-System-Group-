"""Truthful, reproducible Ultralytics YOLO transfer-learning orchestration."""

from __future__ import annotations

import csv
import hashlib
import importlib.metadata
import json
import platform
import re
import sys
import time
import uuid
from dataclasses import asdict, dataclass, field, replace
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.ml.dataset import (
    DatasetValidationReport,
    YoloDatasetValidator,
    create_tiny_smoke_dataset,
    write_dataset_yaml,
    write_manifest,
)
from app.ml.errors import MLConfigurationError
from app.ml.optional import require_module


def _default_project() -> Path:
    return Path(__file__).resolve().parents[2] / "ml_runs"


@dataclass(frozen=True)
class TrainingConfig:
    data: str | Path | None = None
    model: str = "yolov8n.pt"
    epochs: int = 20
    image_size: int = 640
    batch_size: int = 8
    device: str | int | None = None
    workers: int = 2
    seed: int = 42
    patience: int = 10
    pretrained: bool = True
    cache: bool = False
    freeze: int | None = None
    project: Path = field(default_factory=_default_project)
    name: str = "attention-yolo"
    class_names: tuple[str, ...] = ()
    validate_dataset: bool = True
    verify_images: bool = False
    smoke: bool = False

    def __post_init__(self) -> None:
        if self.data is None and not self.smoke:
            raise MLConfigurationError("A dataset path/name is required unless smoke mode creates one.")
        if not self.model.strip():
            raise MLConfigurationError("model cannot be empty.")
        if self.epochs < 1 or self.image_size < 32 or self.batch_size < 1:
            raise MLConfigurationError("epochs and batch_size must be positive; image_size must be at least 32.")
        if self.workers < 0 or self.patience < 0:
            raise MLConfigurationError("workers and patience cannot be negative.")
        if self.freeze is not None and self.freeze < 0:
            raise MLConfigurationError("freeze cannot be negative.")
        if not self.name.strip():
            raise MLConfigurationError("name cannot be empty.")

    def effective(self) -> "TrainingConfig":
        """Return the exact bounded settings that smoke mode will execute."""

        if not self.smoke:
            return self
        return replace(
            self,
            epochs=1,
            image_size=min(self.image_size, 160),
            batch_size=min(self.batch_size, 2),
            workers=0,
            patience=0,
            cache=False,
        )

    def to_dict(self) -> dict[str, Any]:
        payload = asdict(self)
        payload["data"] = str(self.data) if self.data is not None else None
        payload["project"] = str(Path(self.project).expanduser().resolve())
        return payload


@dataclass(frozen=True)
class TrainingOutcome:
    run_directory: Path
    record_path: Path
    metrics: dict[str, Any]
    artifacts: tuple[dict[str, Any], ...]


def run_training(config: TrainingConfig) -> TrainingOutcome:
    """Validate data, run YOLO transfer learning, and persist only observed facts.

    A ``run.json`` record is written before optional imports or training begin and
    is updated to ``completed`` or ``failed``. No metric or artifact is invented.
    """

    effective = config.effective()
    run_directory = _new_run_directory(effective.project, effective.name)
    record_path = run_directory / "run.json"
    started_at = datetime.now(timezone.utc)
    started_monotonic = time.monotonic()
    record: dict[str, Any] = {
        "schema_version": 1,
        "run_id": run_directory.name,
        "status": "initializing",
        "smoke_run": effective.smoke,
        "started_at": started_at.isoformat(),
        "ended_at": None,
        "duration_seconds": None,
        "requested_config": config.to_dict(),
        "effective_config": effective.to_dict(),
        "resolved_data": None,
        "dataset_validation": None,
        "environment": _environment_snapshot(),
        "metrics": {},
        "artifacts": [],
        "error": None,
    }
    _atomic_json(record_path, record)

    try:
        data_argument, validation_report = _prepare_dataset(effective, run_directory)
        record["resolved_data"] = str(data_argument)
        if validation_report is not None:
            manifest_path = write_manifest(validation_report, run_directory / "dataset_manifest.json")
            record["dataset_validation"] = {
                "valid": validation_report.valid,
                "error_count": validation_report.error_count,
                "warning_count": validation_report.warning_count,
                "manifest_path": str(manifest_path),
                "dataset_sha256": validation_report.manifest.dataset_sha256,
                "total_images": validation_report.manifest.total_images,
                "total_annotations": validation_report.manifest.total_annotations,
            }
            _atomic_json(record_path, record)
            validation_report.raise_for_errors()

        ultralytics = require_module(
            "ultralytics",
            purpose="YOLO transfer learning",
            install_command="python -m pip install ultralytics",
        )
        record["environment"] = _environment_snapshot()
        record["status"] = "running"
        _atomic_json(record_path, record)

        model = ultralytics.YOLO(effective.model)
        train_arguments: dict[str, Any] = {
            "data": str(data_argument),
            "epochs": effective.epochs,
            "imgsz": effective.image_size,
            "batch": effective.batch_size,
            "device": effective.device,
            "workers": effective.workers,
            "seed": effective.seed,
            "deterministic": True,
            "patience": effective.patience,
            "pretrained": effective.pretrained,
            "cache": effective.cache,
            "project": str(run_directory.parent),
            "name": run_directory.name,
            "exist_ok": True,
            "save": True,
            "plots": True,
            "val": True,
            "verbose": True,
        }
        if effective.freeze is not None:
            train_arguments["freeze"] = effective.freeze
        results = model.train(**train_arguments)

        metrics = _collect_metrics(results, model, run_directory)
        artifacts = _artifact_inventory(run_directory)
        record["status"] = "completed"
        record["metrics"] = metrics
        record["artifacts"] = artifacts
        return_value = TrainingOutcome(run_directory, record_path, metrics, tuple(artifacts))
    except KeyboardInterrupt as exc:
        record["status"] = "failed"
        record["error"] = {"type": type(exc).__name__, "message": "Training interrupted by user."}
        record["artifacts"] = _artifact_inventory(run_directory)
        raise
    except Exception as exc:
        record["status"] = "failed"
        record["error"] = {"type": type(exc).__name__, "message": str(exc)}
        record["artifacts"] = _artifact_inventory(run_directory)
        raise
    finally:
        record["ended_at"] = datetime.now(timezone.utc).isoformat()
        record["duration_seconds"] = round(time.monotonic() - started_monotonic, 6)
        _atomic_json(record_path, record)

    return return_value


def _prepare_dataset(
    config: TrainingConfig,
    run_directory: Path,
) -> tuple[str | Path, DatasetValidationReport | None]:
    data = config.data
    if config.smoke and data is None:
        yaml_path = create_tiny_smoke_dataset(run_directory / "input" / "synthetic_smoke_dataset")
        validator = YoloDatasetValidator(
            yaml_path.parent,
            ["shopper"],
            verify_images=config.verify_images,
        )
        return yaml_path, validator.validate()
    if data is None:
        raise MLConfigurationError("No dataset was supplied.")

    path = Path(data).expanduser()
    if path.exists():
        path = path.resolve()
        if path.is_dir():
            if not config.class_names:
                raise MLConfigurationError(
                    "Directory datasets require at least one --class-name so class IDs can be validated."
                )
            yaml_path = write_dataset_yaml(run_directory / "input" / "dataset.yaml", path, config.class_names)
            if not config.validate_dataset:
                return yaml_path, None
            validator = YoloDatasetValidator(path, config.class_names, verify_images=config.verify_images)
            return yaml_path, validator.validate()
        if path.suffix.lower() not in {".yaml", ".yml"}:
            raise MLConfigurationError("YOLO data files must use .yaml/.yml, or point to a standard dataset directory.")
        if not config.validate_dataset:
            return path, None
        validator = YoloDatasetValidator.from_yaml(path, verify_images=config.verify_images)
        return path, validator.validate()

    if config.validate_dataset:
        raise FileNotFoundError(
            f"Dataset does not exist locally: {path.resolve()}. "
            "Use --skip-dataset-validation only for a documented Ultralytics built-in dataset name."
        )
    return str(data), None


def _new_run_directory(project: Path, name: str) -> Path:
    project_path = Path(project).expanduser().resolve()
    project_path.mkdir(parents=True, exist_ok=True)
    slug = re.sub(r"[^a-zA-Z0-9._-]+", "-", name.strip()).strip("-.") or "training"
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    for _ in range(10):
        candidate = project_path / f"{slug}-{timestamp}-{uuid.uuid4().hex[:8]}"
        try:
            candidate.mkdir()
            return candidate
        except FileExistsError:
            continue
    raise MLConfigurationError(f"Could not allocate a unique run directory below {project_path}.")


def _environment_snapshot() -> dict[str, Any]:
    packages: dict[str, str | None] = {}
    for name in ("ultralytics", "torch", "torchvision", "numpy", "opencv-python-headless", "PyYAML"):
        try:
            packages[name] = importlib.metadata.version(name)
        except importlib.metadata.PackageNotFoundError:
            packages[name] = None
    return {
        "python": sys.version.split()[0],
        "platform": platform.platform(),
        "packages": packages,
    }


def _collect_metrics(results: Any, model: Any, run_directory: Path) -> dict[str, Any]:
    metrics: dict[str, Any] = {}
    for source_name, source in (
        ("result", getattr(results, "results_dict", None)),
        ("trainer", getattr(getattr(model, "trainer", None), "metrics", None)),
    ):
        if isinstance(source, dict):
            for key, value in source.items():
                converted = _json_scalar(value)
                if converted is not None:
                    metrics[f"{source_name}.{str(key).strip()}"] = converted

    csv_path = run_directory / "results.csv"
    if csv_path.is_file():
        with csv_path.open("r", encoding="utf-8", newline="") as handle:
            last_row = None
            for last_row in csv.DictReader(handle):
                pass
        if last_row:
            for key, value in last_row.items():
                if value is None or not value.strip():
                    continue
                metrics[f"results_csv.{key.strip()}"] = _parse_number(value.strip())
    return metrics


def _json_scalar(value: Any) -> Any | None:
    for method_name in ("detach", "cpu"):
        method = getattr(value, method_name, None)
        if callable(method):
            value = method()
    item = getattr(value, "item", None)
    if callable(item):
        try:
            value = item()
        except (TypeError, ValueError):
            return None
    if isinstance(value, (str, int, float, bool)) or value is None:
        return value
    return None


def _parse_number(value: str) -> int | float | str:
    try:
        number = float(value)
    except ValueError:
        return value
    return int(number) if number.is_integer() else number


def _artifact_inventory(run_directory: Path) -> list[dict[str, Any]]:
    artifacts: list[dict[str, Any]] = []
    ignored_names = {"run.json", "dataset_manifest.json"}
    for path in sorted(run_directory.rglob("*")):
        if not path.is_file() or path.name in ignored_names or "input" in path.relative_to(run_directory).parts:
            continue
        artifacts.append(
            {
                "path": str(path.resolve()),
                "relative_path": path.relative_to(run_directory).as_posix(),
                "bytes": path.stat().st_size,
                "sha256": _file_sha256(path),
                "kind": _artifact_kind(path),
            }
        )
    return artifacts


def _artifact_kind(path: Path) -> str:
    if path.suffix.lower() in {".pt", ".onnx", ".engine", ".torchscript"}:
        return "model"
    if path.name == "results.csv":
        return "metrics"
    if path.suffix.lower() in {".png", ".jpg", ".jpeg"}:
        return "plot"
    return "run_file"


def _file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _atomic_json(path: Path, payload: dict[str, Any]) -> None:
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(payload, indent=2, sort_keys=True), encoding="utf-8")
    temporary.replace(path)
