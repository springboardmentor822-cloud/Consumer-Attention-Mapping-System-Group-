import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.store import Store, Camera

VIDEO_NAME_MAP = {
    # 1. Entrance
    "2_1_crop.mp4": ("Entrance Camera 1", "Entrance"),
    "10901926-hd_1920_1080_30fps.mp4": ("Entrance Camera 2", "Entrance"),
    
    # 2. Bakery
    "9_1_crop.mp4": ("Bakery Camera 1", "Bakery"),
    "9_2_crop.mp4": ("Bakery Camera 2", "Bakery"),
    
    # 3. Beverages (2 Cameras)
    "18_1_crop.mp4": ("Beverage Camera 1", "Beverages"),
    "19_3_crop.mp4": ("Beverage Camera 2", "Beverages"),
    
    # 4. Cooking Products
    "istockphoto-2240347969-640_adpp_is.mp4": ("Cooking Products Camera 1", "Cooking Products"),
    "8_2_crop.mp4": ("Cooking Products Camera 2", "Cooking Products"),
    
    # Billing Counter (2 Cameras)
    "4249560-uhd_3840_2160_25fps.mp4": ("Billing Counter Camera 1", "Billing Counter"),
    "3_1_crop.mp4": ("Billing Counter Camera 2", "Billing Counter"),
    
    # Parking & Perimeter
    "VIRAT_S_050201_05_000890_000944.mp4": ("Parking Lot Camera 1", "Parking"),
    "VIRAT_S_010204_05_000856_000890.mp4": ("Parking Lot Camera 2", "Parking"),
    "2_2_crop.mp4": ("Backdoor Exit Camera", "Backdoor Exit"),
    "8_3_crop.mp4": ("Outside Perimeter Camera", "Outside Perimeter"),
}

db = SessionLocal()

try:
    store = db.query(Store).first()
    if not store:
        store = Store(name="Demo Store", location="Main Headquarters")
        db.add(store)
        db.commit()
        db.refresh(store)

    uploads = os.listdir("uploads") if os.path.exists("uploads") else []
    processed = os.listdir("processed") if os.path.exists("processed") else []

    all_videos = sorted(list(set(uploads + processed)))

    added = 0
    updated = 0
    for v in all_videos:
        if v.endswith(".mp4") and not v.endswith("_temp.mp4"):
            if v in VIDEO_NAME_MAP:
                label_name, loc_name = VIDEO_NAME_MAP[v]
            else:
                label_name = os.path.splitext(v)[0].replace("-", " ").replace("_", " ").title() + " Camera"
                loc_name = "Store Area"

            url = f"http://127.0.0.1:8000/processed/{v}" if os.path.exists(f"processed/{v}") else f"http://127.0.0.1:8000/uploads/{v}"
            
            existing = db.query(Camera).filter(Camera.stream_url.like(f"%{v}%")).first()
            if existing:
                existing.label = label_name
                existing.location = loc_name
                existing.stream_url = url
                existing.status = "online"
                updated += 1
            else:
                cam = Camera(
                    label=label_name,
                    location=loc_name,
                    stream_url=url,
                    status="online",
                    store_id=store.id
                )
                db.add(cam)
                added += 1

    db.commit()
    print(f"Successfully processed cameras in database! Added: {added}, Updated: {updated}")

finally:
    db.close()
