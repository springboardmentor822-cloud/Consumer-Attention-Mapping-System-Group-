"""
Quick WebSocket diagnostic: connect to the CAMS backend and print
the first few track payloads for CAM-01.

Run: python backend/python_engine/ws_diag.py
"""
import asyncio
import json
try:
    import websockets
except ImportError:
    print("Installing websockets...")
    import subprocess, sys
    subprocess.run([sys.executable, "-m", "pip", "install", "websockets"], check=True)
    import websockets


async def main():
    uri = "ws://localhost:8000/cams/stream/CAM-01"
    print(f"Connecting to {uri} ...")
    async with websockets.connect(uri) as ws:
        print("Connected! Waiting for track messages...\n")
        frame_count = 0
        track_frames = 0
        for _ in range(200):  # receive up to 200 messages
            try:
                msg = await asyncio.wait_for(ws.recv(), timeout=5.0)
            except asyncio.TimeoutError:
                print("  [TIMEOUT] No message received in 5s")
                break

            try:
                data = json.loads(msg)
            except Exception:
                print(f"  [RAW] {msg[:120]}")
                continue

            t = data.get("type")
            if t == "connected":
                print(f"  [CONNECTED] {data.get('message')}")
            elif t == "ping":
                await ws.send("pong")
            elif t == "tracks":
                frame_count += 1
                tracks = data.get("tracks", [])
                src = data.get("source", {})
                frame_num = data.get("frameNumber", "?")

                if tracks:
                    track_frames += 1
                    print(f"  Frame #{frame_num:>5} | {len(tracks)} person(s) detected | "
                          f"src={src.get('width')}x{src.get('height')}")
                    for tk in tracks:
                        bb = tk.get("bbox", {})
                        print(f"           -> {tk['trackId']}  bbox=(x1={bb.get('x1')}, y1={bb.get('y1')}, "
                              f"x2={bb.get('x2')}, y2={bb.get('y2')})  conf={tk.get('confidence'):.2f}")
                elif frame_count % 20 == 0:
                    print(f"  Frame #{frame_num:>5} | 0 persons (frame_count={frame_count})")

                if frame_count >= 100:
                    break
            elif t == "error":
                print(f"  [ERROR] {data.get('message')}")
                break

        print(f"\nDone. Received {frame_count} track frames, {track_frames} had detections.")

asyncio.run(main())
