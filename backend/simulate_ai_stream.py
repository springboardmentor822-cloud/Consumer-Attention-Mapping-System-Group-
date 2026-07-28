import argparse
import asyncio
import json
import random
import time
from datetime import datetime, timezone
import uuid
import base64
import io
import numpy as np
from PIL import Image

import httpx

# Configuration
API_URL = "http://localhost:8000/api/stream/ingest"
FRAME_API_URL = "http://localhost:8000/api/stream/frame"

async def simulate_ai(store_id: str, num_shoppers: int, duration_seconds: int):
    print(f"Simulating AI camera stream for Store {store_id}")
    print(f"Generating {num_shoppers} concurrent shoppers for {duration_seconds} seconds...")

    # Initialize shoppers with random starting positions
    shoppers = {}
    for i in range(num_shoppers):
        shopper_id = f"Shopper_{uuid.uuid4().hex[:6]}"
        shoppers[shopper_id] = {
            "x": random.uniform(10.0, 90.0),
            "y": random.uniform(10.0, 90.0),
            "vx": random.uniform(-2.0, 2.0),
            "vy": random.uniform(-2.0, 2.0),
        }

    start_time = time.time()
    
    async with httpx.AsyncClient() as client:
        while time.time() - start_time < duration_seconds:
            # Generate frames at roughly 10 FPS
            await asyncio.sleep(0.1)
            
            for shopper_id, state in shoppers.items():
                # Random walk / bounce off walls
                state["x"] += state["vx"]
                state["y"] += state["vy"]
                
                # Keep within 0-100 bounds for percentage layout
                if state["x"] < 0 or state["x"] > 100:
                    state["vx"] *= -1
                    state["x"] = max(0, min(100, state["x"]))
                if state["y"] < 0 or state["y"] > 100:
                    state["vy"] *= -1
                    state["y"] = max(0, min(100, state["y"]))
                
                # Introduce slight random direction changes (wandering)
                if random.random() < 0.1:
                    state["vx"] = random.uniform(-2.0, 2.0)
                    state["vy"] = random.uniform(-2.0, 2.0)

                payload = {
                    "store_id": store_id,
                    "camera_id": random.choice(["Camera_1", "Camera_2", "Camera_3", "Camera_4"]),
                    "shopper_id": shopper_id,
                    "x": round(state["x"], 2),
                    "y": round(state["y"], 2),
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }

                try:
                    # Fire and forget mostly, but we'll await
                    response = await client.post(API_URL, json=payload)
                    if response.status_code != 202:
                        print(f"Failed to ingest: {response.text}")
                except Exception as e:
                    print(f"Connection error: {e}")
                    
            # Optionally send a dummy frame every second (10 iterations)
            if random.random() < 0.1:
                # Generate a random dummy image
                dummy_img = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
                img = Image.fromarray(dummy_img)
                buffer = io.BytesIO()
                img.save(buffer, format="JPEG")
                img_b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
                
                frame_payload = {
                    "store_id": store_id,
                    "camera_id": random.choice(["Camera_1", "Camera_2"]),
                    "frame_base64": img_b64,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
                try:
                    res = await client.post(FRAME_API_URL, json=frame_payload)
                    if res.status_code == 202:
                        print(f"Successfully posted frame to {FRAME_API_URL}")
                except Exception as e:
                    print(f"Frame Connection error: {e}")

    print("Simulation complete.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Simulate AI Camera Stream")
    parser.add_argument("--store_id", type=str, required=True, help="UUID of the store to simulate")
    parser.add_argument("--shoppers", type=int, default=15, help="Number of concurrent shoppers")
    parser.add_argument("--duration", type=int, default=60, help="Duration in seconds to run the simulation")
    
    args = parser.parse_args()
    
    try:
        asyncio.run(simulate_ai(args.store_id, args.shoppers, args.duration))
    except KeyboardInterrupt:
        print("\nSimulation stopped.")
