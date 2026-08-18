# Save as: backend/app/services/heatmap_engine.py
#
# NOTE: adjust imports marked "ADJUST" to match your actual helper names —
# same caveat as compute_shopper_segments.py, I don't have these files
# in front of me.
#
# Scope decision: renders heatmaps in each camera's own raw pixel space,
# NOT mapped to a unified store floorplan. cv2.findHomography (camera
# coords -> floorplan coords) is deliberately deferred until the mentor
# answers whether to mock a floorplan or skip real-world mapping — see
# the shopper attractiveness-formula question also pending her reply.
# Swapping in floorplan-space coordinates later only means changing what
# points get passed into compute_density_grid(); the KDE/render/cache
# logic below doesn't change.

import base64
import io
import json
import uuid

import numpy as np
import pandas as pd
from scipy.stats import gaussian_kde
import matplotlib
matplotlib.use("Agg")  # no display backend needed, server-side rendering only
import matplotlib.pyplot as plt

from app.core.timescale_db import timescale_engine  # ADJUST if named differently
from app.core.config import settings                 # ADJUST if named differently
import redis

redis_client = redis.from_url(settings.REDIS_URL)

CACHE_TTL_SECONDS = 60 * 15  # heatmaps regenerate every 15 min, matches
                              # the M3 doc's 15-30 min batch-scoring cadence


def _fetch_points(
    camera_id: uuid.UUID,
    class_name: str | None,
    start_time=None,
    end_time=None,
) -> pd.DataFrame:
    """
    Pull raw centroid points for a camera. class_name=None -> person
    (shopper) traffic, since person rows have class_name IS NULL, same
    convention used in compute_shopper_segments.py. Pass an actual SKU
    class_name string to get product-gaze-adjacent density instead (shelf
    interaction hotspots), per the M3 doc's 4 heatmap layers.

    start_time/end_time: optional window filter (datetime or None). Per
    Milestone_3.pdf Step 2 ("Time-Window Aggregation... aggregated by time
    intervals e.g. hourly, daily") and its API spec ("supporting filters
    by... date range") — this is explicitly meant to be date-range-
    filterable, not hardcoded to either "latest run only" or "all runs
    forever". Leave both None to get all data (current default until an
    API layer picks a real window).
    """
    class_filter = "class_name IS NULL" if class_name is None else "class_name = %(class_name)s"
    time_filter = ""
    if start_time is not None:
        time_filter += " AND event_time >= %(start_time)s"
    if end_time is not None:
        time_filter += " AND event_time < %(end_time)s"

    query = f"""
        SELECT (x1+x2)/2.0 AS x, (y1+y2)/2.0 AS y
        FROM tracking_events
        WHERE camera_id = %(camera_id)s AND {class_filter}{time_filter}
    """
    with timescale_engine.connect() as conn:
        return pd.read_sql(query, conn, params={
            "camera_id": str(camera_id),
            "class_name": class_name,
            "start_time": start_time,
            "end_time": end_time,
        })


def compute_density_grid(points: pd.DataFrame, grid_size: int = 100) -> tuple[np.ndarray, tuple]:
    """
    Gaussian KDE over raw (x, y) points -> a grid_size x grid_size density
    matrix. Bounds come from observed min/max coordinates (no real frame
    resolution available per camera yet — same placeholder-bounds gap
    already flagged for the frontend heatmap normalization hack).
    """
    if len(points) < 3:
        raise ValueError(f"Only {len(points)} points — need at least 3 for KDE to fit.")

    x, y = points["x"].to_numpy(), points["y"].to_numpy()
    x_min, x_max = x.min(), x.max()
    y_min, y_max = y.min(), y.max()

    # pad bounds slightly so points at the extreme edge aren't clipped
    x_pad, y_pad = (x_max - x_min) * 0.05, (y_max - y_min) * 0.05
    x_min, x_max = x_min - x_pad, x_max + x_pad
    y_min, y_max = y_min - y_pad, y_max + y_pad

    kde = gaussian_kde(np.vstack([x, y]))
    xx, yy = np.mgrid[x_min:x_max:complex(grid_size), y_min:y_max:complex(grid_size)]
    density = kde(np.vstack([xx.ravel(), yy.ravel()])).reshape(xx.shape)

    return density, (x_min, x_max, y_min, y_max)


def render_heatmap_png(density: np.ndarray, bounds: tuple) -> bytes:
    """Blue=low, Red=high, per the M3 doc's color convention."""
    fig, ax = plt.subplots(figsize=(6, 6), dpi=100)
    ax.imshow(
        density.T,
        extent=bounds,
        origin="lower",
        cmap="jet",       # blue -> red, matches doc's "Blue = Low, Red = High"
        alpha=0.75,
    )
    ax.axis("off")
    fig.patch.set_alpha(0)  # transparent background, for overlay onto camera frame/floorplan later

    buf = io.BytesIO()
    fig.savefig(buf, format="png", bbox_inches="tight", pad_inches=0, transparent=True)
    plt.close(fig)
    buf.seek(0)
    return buf.read()


def get_or_generate_heatmap(
    camera_id: uuid.UUID,
    class_name: str | None = None,
    start_time=None,
    end_time=None,
) -> dict:
    """
    Returns {"image_base64": ..., "bounds": [...], "point_count": N, "cached": bool}.
    Checks Redis first (per M3 doc's Redis-cache-for-fast-reload requirement),
    regenerates + caches on miss. start_time/end_time (datetime or None) pick
    the date-range window per the M3 doc's filter requirement — see
    _fetch_points' docstring. Omit both for all-time data.
    """
    window_key = f"{start_time.isoformat() if start_time else 'all'}:{end_time.isoformat() if end_time else 'all'}"
    cache_key = f"heatmap:{camera_id}:{class_name or 'person'}:{window_key}"
    cached = redis_client.get(cache_key)
    if cached:
        result = json.loads(cached)
        result["cached"] = True
        return result

    points = _fetch_points(camera_id, class_name, start_time, end_time)
    density, bounds = compute_density_grid(points)
    png_bytes = render_heatmap_png(density, bounds)

    result = {
        "image_base64": base64.b64encode(png_bytes).decode("utf-8"),
        "bounds": list(bounds),
        "point_count": len(points),
        "cached": False,
    }
    redis_client.setex(cache_key, CACHE_TTL_SECONDS, json.dumps(result))
    return result


if __name__ == "__main__":
    import sys
    if len(sys.argv) != 2:
        print("Usage: python -m app.services.heatmap_engine <camera_id>")
        sys.exit(1)
    out = get_or_generate_heatmap(uuid.UUID(sys.argv[1]))
    print(f"point_count={out['point_count']} cached={out['cached']} bounds={out['bounds']}")
    # write the PNG to disk so you can actually look at it
    with open("heatmap_preview.png", "wb") as f:
        f.write(base64.b64decode(out["image_base64"]))
    print("saved heatmap_preview.png")
