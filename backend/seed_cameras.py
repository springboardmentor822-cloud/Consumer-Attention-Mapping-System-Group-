import sys, os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.core.database import SessionLocal
from app.models.store import Camera

db = SessionLocal()

db.query(Camera).delete()

cameras = [
    {"label": "Entrance Camera", "location": "Entrance", "stream_url": "http://127.0.0.1:8000/processed/2_1_crop.mp4", "status": "online", "store_id": 1},
    {"label": "Backdoor", "location": "Backdoor", "stream_url": "http://127.0.0.1:8000/processed/2_2_crop.mp4", "status": "online", "store_id": 1},
    {"label": "Billing Counter", "location": "Billing Counter", "stream_url": "http://127.0.0.1:8000/processed/3_1_crop.mp4", "status": "online", "store_id": 1},
    {"label": "Outside", "location": "Outside", "stream_url": "http://127.0.0.1:8000/processed/8_3_crop.mp4", "status": "online", "store_id": 1}
]

for cam in cameras:
    db.add(Camera(**cam))
db.commit()
print("Cameras replaced successfully!")
