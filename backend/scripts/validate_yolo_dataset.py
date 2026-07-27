"""CLI for validating a YOLO detection dataset and writing its manifest."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.ml.dataset import YoloDatasetValidator, write_manifest  # noqa: E402
from app.ml.errors import MLError  # noqa: E402


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Validate normalized YOLO detection labels and image/label pairing.")
    parser.add_argument("dataset", type=Path, help="Dataset YAML or standard dataset root.")
    parser.add_argument("--class-name", action="append", default=[], help="Required in class-ID order for a root directory.")
    parser.add_argument("--split", action="append", dest="splits", help="Repeat to override the default train/val splits.")
    parser.add_argument("--allow-missing-labels", action="store_true")
    parser.add_argument("--verify-images", action="store_true")
    parser.add_argument("--manifest", type=Path, help="Output JSON; defaults to <dataset>/dataset_manifest.json.")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    splits = tuple(args.splits or ("train", "val"))
    try:
        if args.dataset.suffix.lower() in {".yaml", ".yml"}:
            validator = YoloDatasetValidator.from_yaml(
                args.dataset,
                splits=splits,
                require_labels=not args.allow_missing_labels,
                verify_images=args.verify_images,
            )
            default_manifest = args.dataset.resolve().parent / "dataset_manifest.json"
        else:
            if not args.class_name:
                raise ValueError("At least one --class-name is required when validating a dataset directory.")
            validator = YoloDatasetValidator(
                args.dataset,
                args.class_name,
                splits=splits,
                require_labels=not args.allow_missing_labels,
                verify_images=args.verify_images,
            )
            default_manifest = args.dataset.resolve() / "dataset_manifest.json"
        report = validator.validate()
        manifest_path = write_manifest(report, args.manifest or default_manifest)
    except (MLError, FileNotFoundError, ValueError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2

    summary = {
        "valid": report.valid,
        "errors": report.error_count,
        "warnings": report.warning_count,
        "images": report.manifest.total_images,
        "annotations": report.manifest.total_annotations,
        "dataset_sha256": report.manifest.dataset_sha256,
        "manifest": str(manifest_path),
    }
    print(json.dumps(summary, indent=2, sort_keys=True))
    for issue in report.issues:
        location = issue.path or "dataset"
        if issue.line is not None:
            location += f":{issue.line}"
        print(f"{issue.severity.upper()} [{issue.code}] {location}: {issue.message}", file=sys.stderr)
    return 0 if report.valid else 1


if __name__ == "__main__":
    raise SystemExit(main())
