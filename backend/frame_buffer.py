import threading

# ==========================================================
# Latest Processed Camera Frames
# ==========================================================

latest_frames = {
    1: None,
    2: None,
    3: None,
    4: None,
}

# ==========================================================
# Latest Heatmap Frames
# ==========================================================

latest_heatmaps = {
    1: None,
    2: None,
    3: None,
    4: None,
}

# ==========================================================
# Thread Locks
# ==========================================================

frame_locks = {
    1: threading.Lock(),
    2: threading.Lock(),
    3: threading.Lock(),
    4: threading.Lock(),
}

heatmap_locks = {
    1: threading.Lock(),
    2: threading.Lock(),
    3: threading.Lock(),
    4: threading.Lock(),
}

# ==========================================================
# Camera Frames
# ==========================================================

def set_frame(camera_id, frame):

    with frame_locks[camera_id]:
        latest_frames[camera_id] = frame.copy()


def get_frame(camera_id):

    with frame_locks[camera_id]:

        frame = latest_frames[camera_id]

        if frame is None:
            return None

        return frame.copy()

# ==========================================================
# Heatmap Frames
# ==========================================================

def set_heatmap(camera_id, frame):

    with heatmap_locks[camera_id]:
        latest_heatmaps[camera_id] = frame.copy()


def get_heatmap(camera_id):

    with heatmap_locks[camera_id]:

        frame = latest_heatmaps[camera_id]

        if frame is None:
            return None

        return frame.copy()