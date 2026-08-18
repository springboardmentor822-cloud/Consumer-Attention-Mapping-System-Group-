# Save as: backend/app/services/compute_shopper_segments.py
#
# NOTE: adjust the two imports marked "ADJUST" below to match your actual
# session/engine helper names in app/core/db.py and app/core/timescale_db.py —
# I don't have those files in front of me, only their described behavior.

import uuid
import math
from datetime import datetime
from typing import Optional

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sqlmodel import Session, select

from app.core.timescale_db import timescale_engine          # ADJUST if named differently
from app.core.db import engine as postgres_engine            # ADJUST if named differently
from app.models.shopper_segment import ShopperSegment
from app.models.camera import Camera

# No tracker config fully eliminates sub-frame noise (a track lasting a few
# ms is never a real observation). Kept as a permanent guard in the
# pipeline, not a one-off cleanup — independent of whichever ByteTrack
# buffer/threshold config produced the underlying tracking_events.
MIN_DWELL_SECONDS = 1.0

# Below this many valid tracks, K-Means can't produce a meaningful segment
# split (a single cluster over 1 point isn't "segmentation" — it's just
# labeling one track with an arbitrary persona name). Cameras under this
# threshold get an honest "Unsegmented" label instead of a fabricated one.
MIN_TRACKS_FOR_CLUSTERING = 2

# Above MIN_TRACKS_FOR_CLUSTERING, cluster count is capped at 5 (the number
# of named personas) but reduced when a camera doesn't have 5 real tracks
# worth of traffic yet — was previously hardcoded to 5, which crashed on
# every low-traffic camera (Cameras 2/3/4 all failed this before).
MAX_PERSONAS = 5


def _isolate_last_run(df: pd.DataFrame) -> pd.DataFrame:
    """
    Same run-isolation logic as compute_dwell_time.py: TimescaleDB
    accumulates events across every tracking_runner run ever pushed for a
    camera, and frame_index resets to 0 each fresh run. Keep only the
    final run's events so path/dwell numbers aren't double-counted or
    stitched across separate runs.
    """
    df = df.sort_values("event_time").reset_index(drop=True)
    reset_points = df.index[df["frame_index"] == 0].tolist()
    last_run_start = reset_points[-1] if reset_points else 0
    return df.iloc[last_run_start:].reset_index(drop=True)


def _extract_track_features(camera_id: uuid.UUID) -> pd.DataFrame:
    """
    Pull person-track rows (class_name IS NULL — product rows have a
    real SKU class_name, person rows don't) for one camera, isolate the
    latest run, then compute per-track_id trajectory features.
    """
    query = """
        SELECT track_id, frame_index, event_time, x1, y1, x2, y2
        FROM tracking_events
        WHERE camera_id = %(camera_id)s AND class_name IS NULL
        ORDER BY event_time
    """
    with timescale_engine.connect() as conn:
        df = pd.read_sql(query, conn, params={"camera_id": str(camera_id)})

    if df.empty:
        return pd.DataFrame(columns=["track_id", "total_path_distance",
                                      "dwell_time_seconds", "avg_velocity"])

    df = _isolate_last_run(df)
    df["cx"] = (df["x1"] + df["x2"]) / 2.0
    df["cy"] = (df["y1"] + df["y2"]) / 2.0

    rows = []
    for track_id, g in df.groupby("track_id"):
        g = g.sort_values("frame_index")
        if len(g) < 2:
            continue  # can't compute distance/velocity from a single point

        coords = g[["cx", "cy"]].to_numpy()
        deltas = np.diff(coords, axis=0)
        step_dists = np.sqrt((deltas ** 2).sum(axis=1))
        total_path_distance = float(step_dists.sum())

        t0, t1 = g["event_time"].iloc[0], g["event_time"].iloc[-1]
        dwell_time_seconds = max((t1 - t0).total_seconds(), 0.01)  # avoid /0

        avg_velocity = total_path_distance / dwell_time_seconds

        rows.append({
            "track_id": int(track_id),
            "total_path_distance": total_path_distance,
            "dwell_time_seconds": dwell_time_seconds,
            "avg_velocity": avg_velocity,
        })

    return pd.DataFrame(rows)


def _label_clusters(centers: np.ndarray) -> dict[int, str]:
    """
    K-Means gives us k unlabeled cluster centers over
    [path_distance, dwell_time, velocity], where k = min(5, n_tracks) —
    NOT always 5 anymore. Map each cluster index to a persona name by
    ranking centers against the M3 doc's descriptions, rather than
    hardcoding which cluster index means what (KMeans cluster ordering
    isn't stable across runs).

    When k < 5, only the first k personas in priority order below get
    assigned — e.g. with k=2 you'll only ever see "Explorer" and
    "Quick Buyer" for that camera's run, never the other three. That's
    intentional: forcing all 5 persona names onto fewer than 5 real
    clusters would fabricate distinctions the data doesn't support.
    """
    k = centers.shape[0]
    dist_rank = centers[:, 0].argsort()   # low -> high path distance
    dwell_rank = centers[:, 1].argsort()  # low -> high dwell time

    dist_score = np.empty(k)
    dwell_score = np.empty(k)
    dist_score[dist_rank] = np.arange(k)
    dwell_score[dwell_rank] = np.arange(k)

    labels: dict[int, str] = {}
    remaining = set(range(k))

    def pick(criterion, maximize: bool) -> Optional[int]:
        if not remaining:
            return None
        idx = max(remaining, key=criterion) if maximize else min(remaining, key=criterion)
        remaining.discard(idx)
        return idx

    # Explorers: highest path distance AND highest dwell time
    explorer = pick(lambda i: dist_score[i] + dwell_score[i], maximize=True)
    if explorer is not None:
        labels[explorer] = "Explorer"

    # Quick Buyers: lowest dwell time AND lowest path distance
    quick = pick(lambda i: dist_score[i] + dwell_score[i], maximize=False)
    if quick is not None:
        labels[quick] = "Quick Buyer"

    # Comparison Shoppers: high dwell time, low-moderate path distance
    # (parked at one shelf a long time rather than wandering)
    comparison = pick(lambda i: dwell_score[i] - dist_score[i], maximize=True)
    if comparison is not None:
        labels[comparison] = "Comparison Shopper"

    # Brand Loyal: low path distance, moderate-high velocity (direct,
    # purposeful navigation rather than lingering)
    loyal = pick(lambda i: dist_score[i], maximize=False)
    if loyal is not None:
        labels[loyal] = "Brand Loyal Customer"

    # Whatever's left: Impulse Buyer (moderate path, short view)
    if remaining:
        impulse = remaining.pop()
        labels[impulse] = "Impulse Buyer"

    return labels


def compute_and_persist_segments(camera_id: uuid.UUID, store_id: uuid.UUID) -> pd.DataFrame:
    features_df = _extract_track_features(camera_id)

    total_tracks = len(features_df)
    features_df = features_df[features_df["dwell_time_seconds"] >= MIN_DWELL_SECONDS].reset_index(drop=True)
    dropped = total_tracks - len(features_df)
    if dropped:
        print(f"Dropped {dropped}/{total_tracks} tracks under {MIN_DWELL_SECONDS}s "
              f"(likely churn fragments, not real sessions).")

    if len(features_df) == 0:
        print(f"No valid tracks for camera {camera_id} after filtering — nothing to segment.")
        return features_df

    if len(features_df) < MIN_TRACKS_FOR_CLUSTERING:
        # Too little data to form a real cluster split. Label honestly
        # rather than assign an arbitrary persona to a single track —
        # see MIN_TRACKS_FOR_CLUSTERING's docstring above.
        print(f"Only {len(features_df)} valid track(s) for camera {camera_id} — "
              f"below the {MIN_TRACKS_FOR_CLUSTERING}-track minimum for clustering. "
              "Marking as unsegmented instead of fabricating a persona split.")
        features_df["cluster_id"] = -1
        features_df["segment_label"] = "Unsegmented (insufficient data)"
    else:
        # Dynamic k: capped at MAX_PERSONAS, but reduced when this camera
        # doesn't have enough real tracks yet. Previously hardcoded to 5,
        # which crashed outright on every camera with fewer than 5 tracks
        # (Cameras 2/3/4 all failed this before this fix).
        k = min(MAX_PERSONAS, len(features_df))

        X = features_df[["total_path_distance", "dwell_time_seconds", "avg_velocity"]].to_numpy()
        # Standardize — path distance (pixels) and dwell time (seconds) are on
        # very different scales; unscaled K-Means would let distance dominate.
        X_scaled = (X - X.mean(axis=0)) / (X.std(axis=0) + 1e-9)

        km = KMeans(n_clusters=k, n_init=10, random_state=42)
        cluster_ids = km.fit_predict(X_scaled)
        label_map = _label_clusters(km.cluster_centers_)

        features_df["cluster_id"] = cluster_ids
        features_df["segment_label"] = features_df["cluster_id"].map(label_map)

    with Session(postgres_engine) as session:
        for _, row in features_df.iterrows():
            segment = ShopperSegment(
                store_id=store_id,
                camera_id=camera_id,
                track_id=row["track_id"],
                total_path_distance=row["total_path_distance"],
                dwell_time_seconds=row["dwell_time_seconds"],
                avg_velocity=row["avg_velocity"],
                segment_label=row["segment_label"],
                cluster_id=int(row["cluster_id"]),
            )
            session.add(segment)
        session.commit()

    return features_df


if __name__ == "__main__":
    import sys
    if len(sys.argv) != 3:
        print("Usage: python -m app.services.compute_shopper_segments <camera_id> <store_id>")
        sys.exit(1)
    result = compute_and_persist_segments(uuid.UUID(sys.argv[1]), uuid.UUID(sys.argv[2]))
    if result.empty:
        print("No segments computed (no valid tracks).")
    else:
        print(result[["track_id", "segment_label", "total_path_distance",
                       "dwell_time_seconds", "avg_velocity"]].to_string(index=False))
