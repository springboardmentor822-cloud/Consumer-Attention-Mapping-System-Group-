import numpy as np
try:
    import cv2
    OPENCV_AVAILABLE = True
except ImportError:
    OPENCV_AVAILABLE = False

class PerspectiveCalibrator:
    def __init__(self, src_points: list, dst_points: list):
        """
        src_points: List of 4 points in image coordinates [[x1, y1], [x2, y2], [x3, y3], [x4, y4]]
        dst_points: List of 4 points in real store coordinates [[x1, y1], [x2, y2], [x3, y3], [x4, y4]]
        """
        self.src = np.float32(src_points)
        self.dst = np.float32(dst_points)
        self.matrix = None
        
        if OPENCV_AVAILABLE:
            self.matrix = cv2.getPerspectiveTransform(self.src, self.dst)

    def image_to_store(self, x: float, y: float) -> tuple:
        if OPENCV_AVAILABLE and self.matrix is not None:
            points = np.array([[[x, y]]], dtype=np.float32)
            transformed = cv2.perspectiveTransform(points, self.matrix)
            return float(transformed[0][0][0]), float(transformed[0][0][1])
        else:
            # Fallback simple linear mapping
            return x * 0.1, y * 0.1
