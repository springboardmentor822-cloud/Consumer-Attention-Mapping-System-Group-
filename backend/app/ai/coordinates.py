"""
PART 9 - Coordinate Generator

Takes raw tracker output and shapes it into the final coordinate
records that get saved to the database / returned by the API. Pure
functions - no DB session, no HTTP.

Each record has: customer_id, frame, x, y, camera, zone, timestamp.
"""

from __future__ import annotations

import time
from typing import Iterable


def generate_coordinate_record(
    customer_id: int,
    frame_number: int,
    x: float,
    y: float,
    camera_id: int,
    zone_id: int | None = None,
    confidence: float = 0.0,
    timestamp: float | None = None,
) -> dict:
    """Build a single normalized coordinate record."""
    return {
        "customer_id": customer_id,
        "frame": frame_number,
        "x": round(x, 2),
        "y": round(y, 2),
        "camera": camera_id,
        "zone": zone_id,
        "confidence": round(confidence, 4),
        "timestamp": timestamp if timestamp is not None else time.time(),
    }


def generate_coordinates_for_frame(
    frame_tracks: Iterable[dict],
    camera_id: int,
    zone_id: int | None = None,
) -> list[dict]:
    """
    Convert a frame's worth of tracker output (from
    `CustomerTracker.update`) into coordinate records ready for
    persistence or API response.
    """
    return [
        generate_coordinate_record(
            customer_id=track["customer_id"],
            frame_number=track["frame"],
            x=track["x"],
            y=track["y"],
            camera_id=camera_id,
            zone_id=zone_id,
            confidence=track.get("confidence", 0.0),
        )
        for track in frame_tracks
    ]


def batch_generate_coordinates(
    all_frame_tracks: Iterable[Iterable[dict]],
    camera_id: int,
    zone_id: int | None = None,
) -> list[dict]:
    """Flatten coordinate generation across many frames into one list."""
    records: list[dict] = []
    for frame_tracks in all_frame_tracks:
        records.extend(generate_coordinates_for_frame(frame_tracks, camera_id, zone_id))
    return records
