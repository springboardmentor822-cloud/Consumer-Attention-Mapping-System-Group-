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
            if weights_path and os.path.exists(weights_path):
                self.model = YOLO(weights_path)
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
                    if cls_name == "person":
                        xyxy = box.xyxy[0].tolist()
                        conf = float(box.conf[0])
                        detections.append({
                            "class": "person",
                            "confidence": conf,
                            "bbox": xyxy
                        })
            return detections
        else:
            raise RuntimeError("YOLO person detector is not initialized.")

class ProductDetector:
    def __init__(self, weights_path: str = None, device: str = "cpu"):
        self.device = device
        self.model = None
        self.saved_raw_sample = False
        
        self.is_retail = False
        if ULTRALYTICS_AVAILABLE:
            retail_path = None
            for p in ["backend/models/yolov8-retail.pt", "models/yolov8-retail.pt", os.path.join(os.path.dirname(__file__), "..", "..", "models", "yolov8-retail.pt")]:
                if os.path.exists(p):
                    retail_path = p
                    break
            
            if weights_path and os.path.exists(weights_path):
                self.model = YOLO(weights_path)
                self.is_retail = "retail" in weights_path.lower()
                print(f"[YOLO] ProductDetector initialized with: {os.path.abspath(weights_path)}")
            elif retail_path:
                self.model = YOLO(retail_path)
                self.is_retail = True
                print(f"[YOLO] ProductDetector initialized with: {os.path.abspath(retail_path)}")
            else:
                self.model = YOLO("yolov8n.pt")
                self.is_retail = False
                print(f"[YOLO] ProductDetector initialized with default: {os.path.abspath('yolov8n.pt')}")
            self.model.to(device)

    def detect(self, frame, confidence_threshold: float = None) -> list:
        if confidence_threshold is None:
            confidence_threshold = 0.01 if self.is_retail else 0.15
            
        if self.model is not None:
            results = self.model(frame, conf=confidence_threshold, device=self.device, verbose=False)
            detections = []
            
            # Save exactly one raw inference image before drawing overlays
            if not self.saved_raw_sample and len(results) > 0:
                out_path = "backend/datasets/output_videos/raw_inference_sku110k.jpg"
                results[0].save(out_path)
                print(f"[AUDIT] Saved raw product detection inference frame to: {os.path.abspath(out_path)}")
                self.saved_raw_sample = True
                
            for r in results:
                for box in r.boxes:
                    cls_idx = int(box.cls[0])
                    cls_name = self.model.names[cls_idx]
                    
                    if self.is_retail:
                        display_name = "Shelf Product"
                    else:
                        # Restrict COCO classes to retail-like items
                        allowed = ["bottle", "cup", "banana", "apple", "sandwich", "orange", "broccoli", "carrot", "hot dog", "pizza", "donut", "cake"]
                        if cls_name not in allowed:
                            continue
                        display_name = cls_name.capitalize()
                            
                    xyxy = box.xyxy[0].tolist()
                    conf = float(box.conf[0])
                    detections.append({
                        "class": display_name,
                        "confidence": conf,
                        "bbox": xyxy
                    })
            print(f"[YOLO] ProductDetector parsed {len(detections)} product items at conf={confidence_threshold}")
            return detections
        else:
            raise RuntimeError("YOLO product detector is not initialized.")

    @staticmethod
    def nms(detections: list, iou_threshold: float = 0.3, max_products: int = 8) -> list:
        if not detections:
            return []
            
        # Sort by confidence descending
        sorted_dets = sorted(detections, key=lambda x: x["confidence"], reverse=True)
        keep = []
        
        def get_iou(boxA, boxB):
            xA = max(boxA[0], boxB[0])
            yA = max(boxA[1], boxB[1])
            xB = min(boxA[2], boxB[2])
            yB = min(boxA[3], boxB[3])
            
            interArea = max(0, xB - xA) * max(0, yB - yA)
            boxAArea = (boxA[2] - boxA[0]) * (boxA[3] - boxA[1])
            boxBArea = (boxB[2] - boxB[0]) * (boxB[3] - boxB[1])
            
            return interArea / float(boxAArea + boxBArea - interArea + 1e-6)
            
        for det in sorted_dets:
            boxA = det["bbox"]
            overlap = False
            for k_det in keep:
                boxB = k_det["bbox"]
                if get_iou(boxA, boxB) > iou_threshold:
                    overlap = True
                    break
            if not overlap:
                keep.append(det)
                if len(keep) >= max_products:
                    break
        return keep
