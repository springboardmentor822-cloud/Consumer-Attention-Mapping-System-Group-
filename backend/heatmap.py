import cv2
import numpy as np
from collections import deque


class HeatmapGenerator:
    """
    Generates and manages a heatmap for a single camera.
    """

    def __init__(
        self,
        width=640,
        height=480,
        max_points=6000,
    ):

        self.width = width
        self.height = height

        self.points = deque(maxlen=max_points)

        self.heat = np.zeros(
            (height, width),
            dtype=np.float32,
        )

        self.cached_image = np.zeros(
            (height, width, 3),
            dtype=np.uint8,
        )

    # ==========================================================
    # Add Customer Position
    # ==========================================================

    def update(self, x, y):

        x = int(x)
        y = int(y)

        if not (0 <= x < self.width and 0 <= y < self.height):
            return

        self.points.append((x, y))

    # ==========================================================
    # Generate Heat Matrix
    # ==========================================================

    def generate(self):

        self.heat.fill(0)

        if not self.points:
            return

        for x, y in self.points:

            cv2.circle(
                self.heat,
                (x, y),
                35,
                4,
                -1,
            )

        cv2.GaussianBlur(
            self.heat,
            (41, 41),
            0,
            dst=self.heat,
        )

    # ==========================================================
    # Overlay Heatmap
    # ==========================================================

    def overlay(self, frame):

        self.generate()

        if self.heat.max() == 0:
            return frame

        normalized = cv2.normalize(
            self.heat,
            None,
            0,
            255,
            cv2.NORM_MINMAX,
        ).astype(np.uint8)

        coloured = cv2.applyColorMap(
            normalized,
            cv2.COLORMAP_JET,
        )

        return cv2.addWeighted(
            frame,
            0.45,
            coloured,
            0.55,
            0,
        )

    # ==========================================================
    # Heatmap Only
    # ==========================================================

    def heatmap_only(self):

        if not self.points:
            return self.cached_image

        self.generate()

        normalized = cv2.normalize(
            self.heat,
            None,
            0,
            255,
            cv2.NORM_MINMAX,
        ).astype(np.uint8)

        self.cached_image = cv2.applyColorMap(
            normalized,
            cv2.COLORMAP_JET,
        )

        return self.cached_image

    # ==========================================================
    # Statistics
    # ==========================================================

    def total_points(self):
        return len(self.points)

    # ==========================================================
    # Reset
    # ==========================================================

    def clear(self):

        self.points.clear()

        self.heat.fill(0)

        self.cached_image.fill(0)

    # ==========================================================
    # Save
    # ==========================================================

    def save(self, filename="heatmap.png"):

        cv2.imwrite(
            filename,
            self.heatmap_only(),
        )


# ==========================================================
# Heatmaps
# ==========================================================

heatmaps = {
    1: HeatmapGenerator(),
    2: HeatmapGenerator(),
}


# ==========================================================
# Helper
# ==========================================================

def get_heatmap(camera_id: int):

    """
    Returns the heatmap for a valid camera.
    """

    return heatmaps.get(camera_id)