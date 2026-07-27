"""Single-worker training job executor backed by persistent TrainingRun rows."""

from __future__ import annotations

from concurrent.futures import Future, ThreadPoolExecutor
from datetime import datetime
from pathlib import Path
from threading import Lock

from app import database, models
from app.config import get_settings


class TrainingJobManager:
    def __init__(self) -> None:
        self._executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="model-training")
        self._futures: dict[str, Future] = {}
        self._lock = Lock()

    def submit(self, run_id: str) -> None:
        with self._lock:
            existing = self._futures.get(run_id)
            if existing is not None and not existing.done():
                return
            self._futures[run_id] = self._executor.submit(self._execute, run_id)

    def running(self, run_id: str) -> bool:
        with self._lock:
            future = self._futures.get(run_id)
            return future is not None and not future.done()

    @staticmethod
    def _execute(run_id: str) -> None:
        from app.ml.training import TrainingConfig, run_training

        with database.SessionLocal() as db:
            run = db.get(models.TrainingRun, run_id)
            if run is None or run.status != models.TrainingStatus.queued:
                return
            run.status = models.TrainingStatus.running
            run.started_at = datetime.utcnow()
            run.error_message = None
            db.commit()

            try:
                options = dict(run.config or {})
                artifact_root = Path(get_settings().model_artifact_dir)
                if not artifact_root.is_absolute():
                    artifact_root = Path(__file__).resolve().parents[2] / artifact_root
                config = TrainingConfig(
                    data=None if options.get("smoke") else run.dataset_yaml,
                    model=run.base_model,
                    epochs=run.epochs,
                    image_size=run.image_size,
                    batch_size=run.batch_size,
                    device=run.device,
                    workers=int(options.get("workers", 0)),
                    seed=run.seed,
                    patience=0 if options.get("smoke") else 10,
                    freeze=options.get("freeze"),
                    project=artifact_root,
                    name=f"store-{run.store_id}-{run.task.value}",
                    validate_dataset=bool(options.get("validate_dataset", True)),
                    smoke=bool(options.get("smoke", False)),
                )
                outcome = run_training(config)
                run.status = models.TrainingStatus.completed
                run.current_epoch = config.effective().epochs
                run.metrics = outcome.metrics
                run.artifact_path = str(outcome.run_directory)
            except Exception as exc:
                run.status = models.TrainingStatus.failed
                run.error_message = f"{type(exc).__name__}: {exc}"
            finally:
                run.completed_at = datetime.utcnow()
                db.commit()


training_jobs = TrainingJobManager()
