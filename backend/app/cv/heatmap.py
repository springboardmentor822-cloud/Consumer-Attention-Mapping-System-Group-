import cv2
import numpy as np
from typing import List, Dict

class HeatmapGenerator:
    def generate(self, frame, detections: List[Dict]):
        if hasattr(detections, "xyxy"):
            confidences = detections.confidence
            detections = [
                {
                    "bbox": [int(value) for value in box],
                    "confidence": float(confidences[index]) if confidences is not None else 1.0,
                }
                for index, box in enumerate(detections.xyxy)
            ]

        if len(detections) == 0:
            return frame
        
        height, width = frame.shape[:2]
        heatmap = np.zeros((height, width), dtype=np.float32)
        
        for det in detections:
            x1, y1, x2, y2 = det["bbox"]
            intensity = det.get("confidence", 1.0)
            heatmap[y1:y2, x1:x2] += intensity
        
        heatmap = cv2.normalize(heatmap, None, 0, 255, cv2.NORM_MINMAX)
        heatmap_colored = cv2.applyColorMap(heatmap.astype(np.uint8), cv2.COLORMAP_JET)
        overlay = cv2.addWeighted(frame, 0.7, heatmap_colored, 0.3, 0)
        return overlay
