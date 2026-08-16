"""
Compute a camera calibration (homography) from a JSON file of point
correspondences and either print it or push it straight to the backend's
Camera.calibration_data field.

Point correspondences file format (points.json):
[
  {"pixel_x": 120, "pixel_y": 430, "floor_x": 0.0, "floor_y": 0.0},
  {"pixel_x": 540, "pixel_y": 430, "floor_x": 4.0, "floor_y": 0.0},
  {"pixel_x": 540, "pixel_y": 200, "floor_x": 4.0, "floor_y": 3.0},
  {"pixel_x": 120, "pixel_y": 200, "floor_x": 0.0, "floor_y": 3.0}
]

Usage:
    # Just compute and print, with a reprojection-error sanity check
    python calibrate.py --points points.json

    # Compute and save calibration for a camera on the running backend
    python calibrate.py --points points.json \
        --backend-url http://localhost:8000/api/v1 \
        --email admin@example.com --password Admin123! \
        --camera-id 1

How to build points.json for a real camera: grab a still frame (see
`extract_frame.py`), pick >=4 points whose real-world floor position you
can measure (tile corners, marked tape, shelf bases), and note down each
point's pixel coordinates from the image plus its measured (x, y) in
meters relative to a fixed origin (e.g. the store entrance).
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import requests

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from ai_models.calibration.homography import CameraCalibration, PointCorrespondence  # noqa: E402


def load_points(path: str) -> list[PointCorrespondence]:
    with open(path) as f:
        raw = json.load(f)
    return [PointCorrespondence(**p) for p in raw]


def main() -> None:
    parser = argparse.ArgumentParser(description="Compute a camera calibration homography.")
    parser.add_argument("--points", required=True, help="Path to a JSON file of point correspondences.")
    parser.add_argument("--backend-url", default=None)
    parser.add_argument("--email", default=None)
    parser.add_argument("--password", default=None)
    parser.add_argument("--camera-id", type=int, default=None)
    args = parser.parse_args()

    points = load_points(args.points)
    calibration = CameraCalibration.from_correspondences(points)
    error = calibration.reprojection_error(points)

    print(f"Computed homography from {len(points)} points.")
    print(f"Mean reprojection error: {error:.4f} m", end="")
    if error > 0.3:
        print("  ⚠ high — double-check your measured points.")
    else:
        print("  ✓ looks reasonable.")

    calibration_json = calibration.to_json()

    if args.backend_url and args.camera_id:
        login = requests.post(
            f"{args.backend_url}/auth/login",
            data={"username": args.email, "password": args.password},
        )
        login.raise_for_status()
        token = login.json()["access_token"]

        resp = requests.put(
            f"{args.backend_url}/cameras/{args.camera_id}",
            json={"calibration_data": calibration_json},
            headers={"Authorization": f"Bearer {token}"},
        )
        resp.raise_for_status()
        print(f"Saved calibration to camera {args.camera_id} on {args.backend_url}.")
    else:
        print("\nCalibration JSON (copy into Camera.calibration_data):")
        print(calibration_json)


if __name__ == "__main__":
    main()
