"""
Camera calibration: converts pixel-space bounding boxes from the
detector into real floor-plan coordinates (meters), using a homography
computed from a handful of known point correspondences.

Why this matters: everything downstream that treats position as
physically meaningful — traffic heatmaps, shelf dwell time, "which zone
is this shopper in" — needs floor coordinates, not raw pixels. A
camera's pixel grid is a perspective projection of the floor; a straight
line in pixel-space is NOT a straight line in real-world distance. A
homography (a 3x3 projective transform) corrects for that, as long as
the points you're mapping lie on a single flat plane (the store floor —
true for people's feet, not for their heads).

How calibration works in practice:
  1. Pick >=4 points in the camera's field of view whose real-world floor
     position you know (e.g. corners of floor tiles, marked tape points,
     shelf base corners you've measured with a tape measure).
  2. Record each point's pixel coordinate (from a still frame) and its
     real-world (x, y) coordinate in meters, relative to some fixed
     origin for the store (e.g. the entrance).
  3. `compute_homography()` turns those correspondences into a 3x3
     matrix, which gets stored as JSON in Camera.calibration_data.
  4. `pixel_to_floor()` applies that matrix to convert any future
     detection's foot position into floor coordinates.

We use the detection's bottom-center point (feet) as the position to
transform, not the bounding box center — a person's head is not on the
floor plane, but their feet (approximately) are, so only the foot point
gives a geometrically valid floor-plane conversion.
"""
from __future__ import annotations

import json
from dataclasses import dataclass

import cv2
import numpy as np


@dataclass
class PointCorrespondence:
    pixel_x: float
    pixel_y: float
    floor_x: float  # meters, relative to the store's chosen origin
    floor_y: float


class CameraCalibration:
    def __init__(self, homography_matrix: np.ndarray):
        if homography_matrix.shape != (3, 3):
            raise ValueError("Homography matrix must be 3x3")
        self.matrix = homography_matrix

    @classmethod
    def from_correspondences(cls, points: list[PointCorrespondence]) -> "CameraCalibration":
        if len(points) < 4:
            raise ValueError(
                f"Need at least 4 point correspondences to compute a homography, got {len(points)}"
            )
        pixel_pts = np.array([[p.pixel_x, p.pixel_y] for p in points], dtype=np.float32)
        floor_pts = np.array([[p.floor_x, p.floor_y] for p in points], dtype=np.float32)

        matrix, mask = cv2.findHomography(pixel_pts, floor_pts, method=0)
        if matrix is None:
            raise ValueError("Could not compute a homography from the given points (are they collinear?)")
        return cls(matrix)

    @classmethod
    def from_json(cls, calibration_json: str) -> "CameraCalibration":
        data = json.loads(calibration_json)
        matrix = np.array(data["homography_matrix"], dtype=np.float64)
        return cls(matrix)

    def to_json(self) -> str:
        return json.dumps({"homography_matrix": self.matrix.tolist()})

    def pixel_to_floor(self, pixel_x: float, pixel_y: float) -> tuple[float, float]:
        point = np.array([[[pixel_x, pixel_y]]], dtype=np.float32)
        transformed = cv2.perspectiveTransform(point, self.matrix)
        floor_x, floor_y = transformed[0][0]
        return float(floor_x), float(floor_y)

    def reprojection_error(self, points: list[PointCorrespondence]) -> float:
        """Mean distance (meters) between each known floor point and what
        the homography predicts from its pixel point - use this to sanity
        check calibration quality (< ~0.1-0.3m is generally good)."""
        errors = []
        for p in points:
            pred_x, pred_y = self.pixel_to_floor(p.pixel_x, p.pixel_y)
            err = ((pred_x - p.floor_x) ** 2 + (pred_y - p.floor_y) ** 2) ** 0.5
            errors.append(err)
        return sum(errors) / len(errors)


def foot_point(bbox_x: float, bbox_y: float, bbox_w: float, bbox_h: float) -> tuple[float, float]:
    """Bottom-center of a detection's bounding box - the point closest to
    the floor plane, and the correct point to run through a homography."""
    return (bbox_x + bbox_w / 2, bbox_y + bbox_h)
