"""CLI for reproducible YOLO transfer learning and one-epoch smoke runs."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.ml.errors import MLError  # noqa: E402
from app.ml.training import TrainingConfig, run_training  # noqa: E402


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Validate a YOLO dataset, fine-tune a model, and write a truthful run record.",
    )
    parser.add_argument("--data", help="Dataset YAML, standard dataset directory, or built-in dataset name.")
    parser.add_argument("--model", default="yolov8n.pt", help="Ultralytics model YAML or pretrained weights.")
    parser.add_argument("--epochs", type=int, default=20)
    parser.add_argument("--image-size", type=int, default=640)
    parser.add_argument("--batch-size", type=int, default=8)
    parser.add_argument("--device", help="For example: cpu, 0, or 0,1.")
    parser.add_argument("--workers", type=int, default=2)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--patience", type=int, default=10)
    parser.add_argument("--freeze", type=int)
    parser.add_argument("--project", type=Path, default=BACKEND_ROOT / "ml_runs")
    parser.add_argument("--name", default="attention-yolo")
    parser.add_argument(
        "--class-name",
        action="append",
        default=[],
        help="Class name in numeric order; required when --data is a directory.",
    )
    parser.add_argument("--cache", action="store_true")
    parser.add_argument("--no-pretrained", action="store_true")
    parser.add_argument("--verify-images", action="store_true")
    parser.add_argument(
        "--skip-dataset-validation",
        action="store_true",
        help="Use only for an explicitly documented Ultralytics built-in dataset name.",
    )
    parser.add_argument(
        "--smoke",
        action="store_true",
        help="Force one epoch, 160px images, batch <=2, zero workers; creates synthetic data if --data is omitted.",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        config = TrainingConfig(
            data=args.data,
            model=args.model,
            epochs=args.epochs,
            image_size=args.image_size,
            batch_size=args.batch_size,
            device=args.device,
            workers=args.workers,
            seed=args.seed,
            patience=args.patience,
            pretrained=not args.no_pretrained,
            cache=args.cache,
            freeze=args.freeze,
            project=args.project,
            name=args.name,
            class_names=tuple(args.class_name),
            validate_dataset=not args.skip_dataset_validation,
            verify_images=args.verify_images,
            smoke=args.smoke,
        )
        outcome = run_training(config)
    except (MLError, FileNotFoundError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2
    except KeyboardInterrupt:
        print("ERROR: training interrupted by user; inspect the latest run.json for partial state.", file=sys.stderr)
        return 130

    print(
        json.dumps(
            {
                "status": "completed",
                "run_directory": str(outcome.run_directory),
                "record_path": str(outcome.record_path),
                "metrics": outcome.metrics,
                "artifact_count": len(outcome.artifacts),
            },
            indent=2,
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
