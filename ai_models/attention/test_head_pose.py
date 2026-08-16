import sys
from pathlib import Path

import cv2
import numpy as np
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from ai_models.attention.head_pose import (
    _MODEL_POINTS_3D,
    FaceLandmarks2D,
    _camera_matrix,
    estimate_head_pose,
)

FRAME_W, FRAME_H = 640, 480


def _project_model_points(yaw_deg: float, pitch_deg: float, roll_deg: float) -> FaceLandmarks2D:
    """
    Builds a synthetic FaceLandmarks2D by rotating the same 3D face model
    `estimate_head_pose` uses by a KNOWN yaw/pitch/roll, translating it in
    front of a synthetic camera, and projecting it to 2D pixel space.
    `estimate_head_pose` should then recover ~the same angles from those
    2D points - this is the ground truth check.
    """
    yaw, pitch, roll = np.radians([yaw_deg, pitch_deg, roll_deg])

    rot_x = np.array([[1, 0, 0], [0, np.cos(pitch), -np.sin(pitch)], [0, np.sin(pitch), np.cos(pitch)]])
    rot_y = np.array([[np.cos(yaw), 0, np.sin(yaw)], [0, 1, 0], [-np.sin(yaw), 0, np.cos(yaw)]])
    rot_z = np.array([[np.cos(roll), -np.sin(roll), 0], [np.sin(roll), np.cos(roll), 0], [0, 0, 1]])
    rotation = rot_z @ rot_x @ rot_y

    translation = np.array([0, 0, 700.0])  # 700mm in front of the camera
    camera_matrix = _camera_matrix(FRAME_W, FRAME_H)

    rotated = (rotation @ _MODEL_POINTS_3D.T).T + translation
    projected, _ = cv2.projectPoints(
        rotated, np.zeros(3), np.zeros(3), camera_matrix, np.zeros((4, 1))
    )
    pts = projected.reshape(-1, 2)

    return FaceLandmarks2D(
        nose_tip=tuple(pts[0]),
        chin=tuple(pts[1]),
        left_eye_outer=tuple(pts[2]),
        right_eye_outer=tuple(pts[3]),
        left_mouth_corner=tuple(pts[4]),
        right_mouth_corner=tuple(pts[5]),
    )


@pytest.mark.parametrize(
    "yaw,pitch,roll",
    [
        (0.0, 0.0, 0.0),
        (20.0, 0.0, 0.0),
        (-25.0, 0.0, 0.0),
        (0.0, 15.0, 0.0),
        (0.0, -15.0, 0.0),
        (10.0, 5.0, 5.0),
    ],
)
def test_recovers_known_rotation(yaw, pitch, roll):
    landmarks = _project_model_points(yaw, pitch, roll)
    pose = estimate_head_pose(landmarks, FRAME_W, FRAME_H)

    assert abs(pose.yaw - yaw) < 3.0, f"yaw off: got {pose.yaw}, expected {yaw}"
    assert abs(pose.pitch - pitch) < 3.0, f"pitch off: got {pose.pitch}, expected {pitch}"
    assert abs(pose.roll - roll) < 3.0, f"roll off: got {pose.roll}, expected {roll}"


def test_frontal_face_is_near_zero():
    landmarks = _project_model_points(0.0, 0.0, 0.0)
    pose = estimate_head_pose(landmarks, FRAME_W, FRAME_H)
    assert abs(pose.yaw) < 1.0
    assert abs(pose.pitch) < 1.0
    assert abs(pose.roll) < 1.0
