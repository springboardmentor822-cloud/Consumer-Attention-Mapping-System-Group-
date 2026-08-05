import cv2

cap = cv2.VideoCapture("videos/customer_demo.mp4")

print("Opened:", cap.isOpened())

while True:

    ret, frame = cap.read()

    print("Frame:", ret)

    if not ret:
        break

cap.release()