import os
import sys
import time
import cv2

# Setup import path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.ml.detector import PersonDetector, ProductDetector

INPUT_VIDEO = "backend/datasets/retail_videos/aisle_camera_1.mp4"
OUTPUT_VIDEO = "backend/datasets/output_videos/debug_visualization_output.mp4"

def audit_pipeline():
    print(f"Opening video: {INPUT_VIDEO}")
    cap = cv2.VideoCapture(INPUT_VIDEO)
    if not cap.isOpened():
        print(f"Error opening video {INPUT_VIDEO}")
        return
        
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    writer = cv2.VideoWriter(OUTPUT_VIDEO, fourcc, fps, (640, 480))
    
    detector = PersonDetector()
    product_detector = ProductDetector()
    
    frame_idx = 0
    total_raw_prods = 0
    total_conf_removed = 0
    total_class_removed = 0
    total_drawn = 0
    
    # Process first 50 frames to do a deep audit trace
    while cap.isOpened() and frame_idx < 50:
        ret, frame = cap.read()
        if not ret:
            break
            
        frame_idx += 1
        frame_resized = cv2.resize(frame, (640, 480))
        
        # 1. Get raw YOLO results directly to track filters
        conf_thresh = 0.01
        raw_results = product_detector.model(frame_resized, conf=0.01, verbose=False)
        
        raw_boxes = len(raw_results[0].boxes) if len(raw_results) > 0 else 0
        total_raw_prods += raw_boxes
        
        conf_removed = 0
        class_removed = 0
        drawn_frame = 0
        
        # Draw products
        products = product_detector.detect(frame_resized, confidence_threshold=conf_thresh)
        
        for p in products:
            p_bbox = p["bbox"]
            px1, py1, px2, py2 = map(int, p_bbox)
            
            # Draw GREEN boxes on products
            cv2.rectangle(frame_resized, (px1, py1), (px2, py2), (0, 255, 0), 1)
            cv2.putText(frame_resized, f"{p['class']} {p['confidence']:.2f}", (px1, py1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (0, 255, 0), 1)
            drawn_frame += 1
            
        # Draw persons (BLUE boxes)
        persons = detector.detect(frame_resized)
        for pers in persons:
            p_bbox = pers["bbox"]
            px1, py1, px2, py2 = map(int, p_bbox)
            cv2.rectangle(frame_resized, (px1, py1), (px2, py2), (255, 0, 0), 2)
            cv2.putText(frame_resized, f"Person {pers['confidence']:.2f}", (px1, py1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 0, 0), 1)
            
        # Compute filter counts for debug
        if len(raw_results) > 0:
            for box in raw_results[0].boxes:
                cls_idx = int(box.cls[0])
                cls_name = product_detector.model.names[cls_idx]
                conf = float(box.conf[0])
                
                if conf < conf_thresh:
                    conf_removed += 1
                elif cls_name == "person":
                    class_removed += 1
                    
        total_conf_removed += conf_removed
        total_class_removed += class_removed
        total_drawn += drawn_frame
        
        print(f"Frame {frame_idx} | Raw detections: {raw_boxes} | Removed by confidence: {conf_removed} | Removed by class filter: {class_removed} | Final drawn: {drawn_frame}")
        
        writer.write(frame_resized)
        
    cap.release()
    writer.release()
    
    print("\n=== Pipeline Visual Audit Verification Summary ===")
    print(f"Total processed frames: {frame_idx}")
    print(f"Total raw product detections entering: {total_raw_prods}")
    print(f"Total removed by confidence filter (<{conf_thresh}): {total_conf_removed}")
    print(f"Total removed by class filter ('person'): {total_class_removed}")
    print(f"Total finally drawn: {total_drawn}")
    print(f"Debugging video saved to: {os.path.abspath(OUTPUT_VIDEO)}")

if __name__ == "__main__":
    audit_pipeline()
