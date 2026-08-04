import os
try:
    from ultralytics import YOLO
    ULTRALYTICS_AVAILABLE = True
except ImportError:
    ULTRALYTICS_AVAILABLE = False

class PersonDetector:
    def __init__(self, weights_path: str = None, device: str = "cpu"):
        self.device = device
        self.model = None
        
        if ULTRALYTICS_AVAILABLE:
            retail_path = "backend/models/yolov8-retail.pt"
            if weights_path and os.path.exists(weights_path):
                self.model = YOLO(weights_path)
            elif os.path.exists(retail_path):
                self.model = YOLO(retail_path)
            else:
                self.model = YOLO("yolov8n.pt")
            self.model.to(device)

    def detect(self, frame, confidence_threshold: float = 0.25) -> list:
        if self.model is not None:
            results = self.model(frame, conf=confidence_threshold, device=self.device, verbose=False)
            detections = []
            for r in results:
                for box in r.boxes:
                    cls_idx = int(box.cls[0])
                    cls_name = self.model.names[cls_idx]
                    # Accept custom retail classes (like product or shelf item) in addition to person
                    if cls_name in ["person", "product", "shelf_item", "item"]:
                        xyxy = box.xyxy[0].tolist()
                        conf = float(box.conf[0])
                        detections.append({
                            "class": cls_name,
                            "confidence": conf,
                            "bbox": xyxy
                        })
            return detections
        else:
            raise RuntimeError("YOLO object detector is not initialized (Ultralytics package missing).")
