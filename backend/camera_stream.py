import os

# ==========================================================
# BASE DIRECTORY
# ==========================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ==========================================================
# VIDEOS DIRECTORY
# ==========================================================

VIDEO_FOLDER = os.path.join(BASE_DIR, "videos")

# ==========================================================
# CAMERA CONFIGURATION
# ==========================================================

CAMERAS = {
    1: {
        "id": 1,
        "name": "Entrance",
        "video": os.path.join(VIDEO_FOLDER, "entrance.mp4"),
    },

    2: {
        "id": 2,
        "name": "Supermarket Aisle",
        "video": os.path.join(VIDEO_FOLDER, "aisle.mp4"),
    },
}

SUPPORTED_CAMERAS = tuple(CAMERAS.keys())


# ==========================================================
# GET CAMERA DETAILS
# ==========================================================

def get_camera(camera_id: int):
    """
    Returns camera configuration.
    """

    return CAMERAS.get(camera_id)


# ==========================================================
# GET VIDEO PATH
# ==========================================================

def get_video_path(camera_id: int):
    """
    Returns video file path.
    """

    camera = get_camera(camera_id)

    if camera is None:
        return None

    return camera["video"]


# ==========================================================
# GET ALL CAMERAS
# ==========================================================

def get_all_cameras():
    """
    Returns all configured cameras.
    """

    return CAMERAS


# ==========================================================
# CHECK CAMERA
# ==========================================================

def is_valid_camera(camera_id: int):
    """
    Returns True if the camera exists.
    """

    return camera_id in CAMERAS