import sys
from pathlib import Path

import cv2
import numpy as np
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from ai_models.calibration.homography import CameraCalibration, PointCorrespondence, foot_point


def _true_pixel_to_floor(matrix: np.ndarray, pixel_x: float, pixel_y: float) -> tuple[float, float]:
    point = np.array([[[pixel_x, pixel_y]]], dtype=np.float64)
    transformed = cv2.perspectiveTransform(point, matrix)
    return float(transformed[0][0][0]), float(transformed[0][0][1])


@pytest.fixture
def true_homography() -> np.ndarray:
    """
    A hand-picked, invertible 3x3 projective transform simulating a camera
    looking down an aisle at an angle (not a pure affine transform - it
    has real perspective distortion), used as ground truth to test
    against. Values are arbitrary but chosen to be well-conditioned.
    """
    return np.array(
        [
            [0.008, 0.0, -1.0],
            [0.0, 0.006, -1.2],
            [0.00002, 0.00001, 1.0],
        ],
        dtype=np.float64,
    )


def test_calibration_recovers_known_correspondences(true_homography):
    pixel_points = [(100, 400), (600, 400), (600, 150), (100, 150), (350, 300)]
    points = []
    for px, py in pixel_points:
        fx, fy = _true_pixel_to_floor(true_homography, px, py)
        points.append(PointCorrespondence(pixel_x=px, pixel_y=py, floor_x=fx, floor_y=fy))

    calibration = CameraCalibration.from_correspondences(points)
    error = calibration.reprojection_error(points)

    # fit on its own correspondence points should reproduce them almost exactly
    assert error < 0.01


def test_calibration_generalizes_to_held_out_point(true_homography):
    fit_pixel_points = [(100, 400), (600, 400), (600, 150), (100, 150)]
    fit_points = []
    for px, py in fit_pixel_points:
        fx, fy = _true_pixel_to_floor(true_homography, px, py)
        fit_points.append(PointCorrespondence(pixel_x=px, pixel_y=py, floor_x=fx, floor_y=fy))

    calibration = CameraCalibration.from_correspondences(fit_points)

    # a point NOT used for fitting
    held_out_px, held_out_py = 400, 300
    expected_fx, expected_fy = _true_pixel_to_floor(true_homography, held_out_px, held_out_py)
    predicted_fx, predicted_fy = calibration.pixel_to_floor(held_out_px, held_out_py)

    assert abs(predicted_fx - expected_fx) < 0.05
    assert abs(predicted_fy - expected_fy) < 0.05


def test_requires_at_least_four_points():
    points = [
        PointCorrespondence(pixel_x=0, pixel_y=0, floor_x=0, floor_y=0),
        PointCorrespondence(pixel_x=1, pixel_y=1, floor_x=1, floor_y=1),
        PointCorrespondence(pixel_x=2, pixel_y=2, floor_x=2, floor_y=2),
    ]
    with pytest.raises(ValueError):
        CameraCalibration.from_correspondences(points)


def test_json_roundtrip(true_homography):
    pixel_points = [(100, 400), (600, 400), (600, 150), (100, 150)]
    points = []
    for px, py in pixel_points:
        fx, fy = _true_pixel_to_floor(true_homography, px, py)
        points.append(PointCorrespondence(pixel_x=px, pixel_y=py, floor_x=fx, floor_y=fy))
    calibration = CameraCalibration.from_correspondences(points)

    restored = CameraCalibration.from_json(calibration.to_json())
    fx1, fy1 = calibration.pixel_to_floor(300, 300)
    fx2, fy2 = restored.pixel_to_floor(300, 300)
    assert abs(fx1 - fx2) < 1e-9
    assert abs(fy1 - fy2) < 1e-9


def test_foot_point_is_bottom_center():
    fx, fy = foot_point(bbox_x=100, bbox_y=200, bbox_w=50, bbox_h=150)
    assert fx == 125  # x + w/2
    assert fy == 350  # y + h (bottom edge)
