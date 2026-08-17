import asyncio
import json
import websockets
import time

async def test_live_stream():
    uri = "ws://localhost:8000/cams/stream/CAM-01"
    print(f"Connecting to {uri}...")
    async with websockets.connect(uri) as ws:
        msg = await ws.recv()
        print("Connected msg:", msg)
        
        t_start = time.perf_counter()
        for i in range(120):
            raw = await ws.recv()
            data = json.loads(raw)
            tracks = data.get("tracks", [])
            t_ids = [t["trackId"] for t in tracks]
            if i % 15 == 0 or i == 119:
                print(f"Frame {i:03d} (inference={data.get('inferenceMs')}ms) -> Active Tracks: {t_ids}")
                for t in tracks:
                    print(f"   [{t['trackId']}] conf={t['confidence']}% zone={t['zone']} bbox={t['bbox']}")
        
        total_time = time.perf_counter() - t_start
        fps = 120.0 / total_time
        print(f"\n120 frames received in {total_time:.2f}s ({fps:.1f} FPS)")

asyncio.run(test_live_stream())
