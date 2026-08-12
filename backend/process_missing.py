import os
from app.ai.video_loader import process_video

def main():
    videos = ["3_1_crop.mp4", "8_3_crop.mp4"]
    for v in videos:
        input_path = os.path.join("uploads", v)
        output_path = os.path.join("processed", v)
        print(f"Processing {v}...")
        try:
            process_video(input_path, output_path)
            print(f"Successfully processed {v}")
        except Exception as e:
            print(f"Failed to process {v}: {e}")

if __name__ == "__main__":
    main()
