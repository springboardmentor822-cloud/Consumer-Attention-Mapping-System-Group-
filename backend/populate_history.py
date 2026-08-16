import random
from datetime import datetime, timedelta, timezone
from sqlalchemy import text
from app.core.database import SessionLocal
from app.models.models import Camera, ShopperPosition

def populate_historical_data():
    db = SessionLocal()
    try:
        # Fetch seeded cameras on Store 1
        cameras = db.query(Camera).filter(Camera.store_id == 1).all()
        if not cameras:
            print("Error: No cameras found for Store 1. Please run seed.py first.")
            return
            
        print("Generating historical telemetry logs for Store 1...")
        
        # We will populate 5 days of history
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        records_to_add = []
        
        # Camera mappings to zones & coordinates
        # Camera 1: Entrance/Exit Foyer
        # Camera 2: Beverage Aisle
        # Camera 3: Snack Display Aisle
        # Camera 4: Checkout Lanes
        
        shopper_ids = list(range(1001, 1250)) # 250 unique shoppers
        
        for day in range(5):
            date_offset = now - timedelta(days=day)
            
            # Generate 1000 logs per day
            for i in range(1000):
                camera = random.choice(cameras)
                shopper_id = random.choice(shopper_ids)
                
                # Timestamp distributed randomly across the day
                hour = random.randint(8, 22) # Store hours 8am to 10pm
                minute = random.randint(0, 59)
                second = random.randint(0, 59)
                log_time = date_offset.replace(hour=hour, minute=minute, second=second)
                
                # Determine coordinates & target names based on camera
                if "Foyer" in camera.name:
                    x = random.uniform(10, 90)
                    y = random.uniform(5, 20)
                    dwell_time = random.randint(2, 30)
                    gaze_target = "Zone A: Entrance/Main Foyer"
                    gaze_x = x + random.uniform(-5, 5)
                    gaze_y = y + random.uniform(-5, 5)
                elif "Aisle Cam A" in camera.name or "Camera 2" in camera.name:
                    # Beverage shelf region
                    x = random.uniform(10, 45)
                    y = random.uniform(25, 60)
                    dwell_time = random.randint(10, 180)
                    gaze_target = "Shelf 1 (Beverages)"
                    gaze_x = random.uniform(10, 38)
                    gaze_y = random.uniform(30, 45)
                elif "Aisle Cam B" in camera.name or "Camera 3" in camera.name:
                    # Snack shelf region
                    x = random.uniform(50, 90)
                    y = random.uniform(25, 60)
                    dwell_time = random.randint(10, 200)
                    gaze_target = "Shelf 2 (Snacks)"
                    gaze_x = random.uniform(52, 90)
                    gaze_y = random.uniform(30, 45)
                else:
                    # Checkout Lanes
                    x = random.uniform(10, 90)
                    y = random.uniform(70, 90)
                    dwell_time = random.randint(30, 300)
                    gaze_target = "Zone C: Checkout Lanes"
                    gaze_x = x + random.uniform(-5, 5)
                    gaze_y = y + random.uniform(-5, 5)
                
                position = ShopperPosition(
                    camera_id=camera.id,
                    shopper_id=shopper_id,
                    x=round(x, 2),
                    y=round(y, 2),
                    dwell_time=dwell_time,
                    gaze_target=gaze_target,
                    gaze_x=round(gaze_x, 2),
                    gaze_y=round(gaze_y, 2),
                    timestamp=log_time
                )
                records_to_add.append(position)
                
        # Bulk save
        print(f"Bulk saving {len(records_to_add)} shopper position records to database...")
        db.bulk_save_objects(records_to_add)
        db.commit()
        print("Historical telemetry data populated successfully.")
        
    except Exception as e:
        db.rollback()
        print(f"Error populating historical data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    populate_historical_data()
