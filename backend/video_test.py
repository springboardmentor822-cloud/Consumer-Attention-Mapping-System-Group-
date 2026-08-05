import cv2
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
VIDEO = os.path.join(BASE_DIR, "videos", "customer_demo.mp4")

print("Video path:", VIDEO)
print("Exists:", os.path.exists(VIDEO))

cap = cv2.VideoCapture(VIDEO)

print("Opened:", cap.isOpened())

ret, frame = cap.read()

print("First Frame:", ret)

cap.release()