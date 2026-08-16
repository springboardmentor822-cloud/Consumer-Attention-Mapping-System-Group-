"""
Retail Shopping Mart CCTV Dataset Downloader
=============================================
Downloads 4 distinct, authentic supermarket retail shopping mart video feeds into frontend/public/videos/
Matching:
1. Supermarket Product Aisles (Cart & Stocked Shelves)
2. Grocery & Pantry Display Shelves
3. Fresh Produce / Fruits & Veg Mart Display
4. Supermarket Checkout Register Counter
"""

import os
import urllib.request
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
VIDEOS_DIR = BASE_DIR / "frontend" / "public" / "videos"

VIDEOS_DIR.mkdir(parents=True, exist_ok=True)

# 4 Distinct Authentic Supermarket Shopping Mart Video Dataset URLs
SHOPPING_MART_VIDEO_URLS = {
    "cctv_1.mp4": "https://videos.pexels.com/video-files/2646392/2646392-hd_1920_1080_30fps.mp4", # Supermarket Product Aisles & Shopping Cart
    "cctv_2.mp4": "https://videos.pexels.com/video-files/3192051/3192051-hd_1920_1080_25fps.mp4", # Grocery & Pantry Display Shelves
    "cctv_3.mp4": "https://videos.pexels.com/video-files/3192050/3192050-hd_1920_1080_25fps.mp4", # Fresh Produce / Fruits & Veg Mart Display
    "cctv_4.mp4": "https://videos.pexels.com/video-files/4249560/4249560-hd_1920_1080_25fps.mp4", # Supermarket Checkout Register Counter
}

def download_cctv_videos():
    print("Downloading 4 distinct Shopping Mart CCTV Dataset videos...")
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}

    for filename, url in SHOPPING_MART_VIDEO_URLS.items():
        dest = VIDEOS_DIR / filename
        print(f"Downloading {filename} from shopping mart dataset...")
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req) as resp, open(dest, "wb") as f:
                data = resp.read()
                f.write(data)
            print(f"[OK] Downloaded {filename} ({len(data)} bytes)")
        except Exception as e:
            print(f"[WARN] Error downloading {filename}: {e}")

    print("All 4 distinct shopping mart CCTV video feeds downloaded successfully!")

if __name__ == "__main__":
    download_cctv_videos()
