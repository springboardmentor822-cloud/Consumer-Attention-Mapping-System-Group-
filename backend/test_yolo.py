import cv2
from ultralytics import YOLO

if __name__ == "__main__":
    model = YOLO("yolov8n.pt")

    cap = cv2.VideoCapture(0)   # Webcam

    while True:
        ret, frame = cap.read()

        if not ret:
            break

        # class 0 is 'person' in the COCO dataset
        results = model(frame, classes=[0])

        annotated_frame = results[0].plot()

        cv2.imshow("YOLO Detection", annotated_frame)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()