from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

import cv2
import time

from camera_stream import get_video_path
from ai_detector import detect_people
from heatmap import heatmaps

router = APIRouter()

JPEG_QUALITY = 55
FRAME_DELAY = 0.01
FRAME_SIZE = (640, 480)

SUPPORTED_CAMERAS = {1, 2}


# ==========================================================
# OPEN VIDEO
# ==========================================================

def open_video(camera_id: int):

    if camera_id not in SUPPORTED_CAMERAS:
        raise HTTPException(
            status_code=404,
            detail=f"Camera {camera_id} not available."
        )

    video_path = get_video_path(camera_id)

    if video_path is None:
        raise HTTPException(
            status_code=404,
            detail="Video file not found."
        )

    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        raise HTTPException(
            status_code=500,
            detail="Unable to open video."
        )

    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

    return cap


# ==========================================================
# CAMERA STREAM
# ==========================================================

def generate_camera_frames(camera_id: int):

    cap = open_video(camera_id)

    try:

        while True:

            success, frame = cap.read()

            if not success:
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue

            frame = cv2.resize(frame, FRAME_SIZE)

            frame = detect_people(camera_id, frame)

            ok, buffer = cv2.imencode(
                ".jpg",
                frame,
                [int(cv2.IMWRITE_JPEG_QUALITY), JPEG_QUALITY],
            )

            if not ok:
                continue

            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n\r\n"
                + buffer.tobytes()
                + b"\r\n"
            )

            time.sleep(FRAME_DELAY)

    finally:
        cap.release()


# ==========================================================
# HEATMAP STREAM
# ==========================================================

def generate_heatmap_frames(camera_id: int):

    cap = open_video(camera_id)

    try:

        while True:

            success, frame = cap.read()

            if not success:
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue

            frame = cv2.resize(frame, FRAME_SIZE)

            frame = detect_people(camera_id, frame)

            heatmap_frame = heatmaps[camera_id].overlay(frame)

            heatmap_frame = cv2.resize(
                heatmap_frame,
                (480, 360),
            )

            ok, buffer = cv2.imencode(
                ".jpg",
                heatmap_frame,
                [int(cv2.IMWRITE_JPEG_QUALITY), JPEG_QUALITY],
            )

            if not ok:
                continue

            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n\r\n"
                + buffer.tobytes()
                + b"\r\n"
            )

            time.sleep(FRAME_DELAY)

    finally:
        cap.release()


# ==========================================================
# ROUTES
# ==========================================================

@router.get("/{camera_id}")
def camera_video(camera_id: int):

    return StreamingResponse(
        generate_camera_frames(camera_id),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )


@router.get("/heatmap/{camera_id}")
def camera_heatmap(camera_id: int):

    return StreamingResponse(
        generate_heatmap_frames(camera_id),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )