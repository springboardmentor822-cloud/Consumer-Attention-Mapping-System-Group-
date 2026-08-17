import torch
from ultralytics import YOLO
import glob
import cv2
import time
import os

print("PyTorch version:", torch.__version__)
print("CUDA available:", torch.cuda.is_available())
if torch.cuda.is_available():
    print("Device name:", torch.cuda.get_device_name(0))

videos = glob.glob('backend/**/*.mp4', recursive=True)
print("Found videos:", videos)

# Check models
models = glob.glob('**/*.pt', recursive=True)
print("Found models:", models)
