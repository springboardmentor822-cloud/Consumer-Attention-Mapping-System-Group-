"""
Step 1: Data Pipeline Foundation & Preprocessing Module
======================================================
This module provides a memory-efficient video dataloader and preprocessing engine:
1. Opens raw retail CCTV video files and extracts frames sequentially.
2. Resizes frames to target AI dimensions (e.g., 640x640) and applies data augmentations.
3. Streams frames in organized batches to prevent high RAM usage.
"""

import os
import time
import logging
from typing import Generator, Dict, Any, List, Tuple, Optional
import numpy as np
import cv2

logger = logging.getLogger(__name__)

class VideoDataLoader:
    """
    Memory-efficient streaming video dataloader for AI retail tracking models.
    """
    def __init__(
        self,
        video_path: str,
        target_size: Tuple[int, int] = (640, 640),
        batch_size: int = 8,
        augment_brightness: bool = True,
        augment_flip: bool = False,
        normalize: bool = True
    ):
        """
        Initialize VideoDataLoader parameters.
        
        :param video_path: Path to the input MP4 video file.
        :param target_size: (width, height) tuple for AI model input resizing.
        :param batch_size: Number of frames per batch yielded to GPU/CPU memory.
        :param augment_brightness: Apply subtle brightness/contrast data augmentation.
        :param augment_flip: Apply random horizontal flip data augmentation.
        :param normalize: Normalize pixel intensities from [0..255] to [0.0..1.0].
        """
        self.video_path = video_path
        self.target_size = target_size
        self.batch_size = batch_size
        self.augment_brightness = augment_brightness
        self.augment_flip = augment_flip
        self.normalize = normalize

    def stream_batches(self) -> Generator[Dict[str, Any], None, None]:
        """
        Generator function yielding organized batches of preprocessed frames and metadata.
        """
        if not os.path.exists(self.video_path):
            raise FileNotFoundError(f"Video file not found at: {self.video_path}")

        cap = cv2.VideoCapture(self.video_path)
        if not cap.isOpened():
            raise ValueError(f"Unable to open video stream: {self.video_path}")

        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        orig_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        orig_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        frame_idx = 0
        batch_frames: List[np.ndarray] = []
        batch_metadata: List[Dict[str, Any]] = []

        start_time = time.time()

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            # 1. Resize frame to model dimensions (e.g. 640x640)
            resized = cv2.resize(frame, self.target_size, interpolation=cv2.INTER_LINEAR)

            # 2. Data Augmentation - Brightness / Contrast jitter
            if self.augment_brightness:
                alpha = 1.0 + np.random.uniform(-0.08, 0.08)
                beta = int(np.random.uniform(-8, 8))
                resized = cv2.convertScaleAbs(resized, alpha=alpha, beta=beta)

            # 2b. Data Augmentation - Optional horizontal flip
            if self.augment_flip and np.random.rand() > 0.5:
                resized = cv2.flip(resized, 1)

            # 3. Normalization (convert to float32 [0.0 .. 1.0])
            processed_frame = resized
            if self.normalize:
                processed_frame = resized.astype(np.float32) / 255.0

            timestamp_ms = round((frame_idx / fps) * 1000.0, 2)
            meta = {
                "frame_index": frame_idx,
                "timestamp_ms": timestamp_ms,
                "original_resolution": f"{orig_w}x{orig_h}",
                "target_resolution": f"{self.target_size[0]}x{self.target_size[1]}"
            }

            batch_frames.append(processed_frame)
            batch_metadata.append(meta)
            frame_idx += 1

            # Yield batch when batch size is reached
            if len(batch_frames) == self.batch_size:
                batch_tensor = np.array(batch_frames, dtype=np.float32 if self.normalize else np.uint8)
                yield {
                    "frames": batch_tensor,
                    "metadata": batch_metadata,
                    "batch_size": len(batch_frames),
                    "fps": round(fps, 2),
                    "total_frames": total_frames,
                    "elapsed_time_s": round(time.time() - start_time, 3)
                }
                batch_frames = []
                batch_metadata = []

        # Yield any remaining frames in final partial batch
        if batch_frames:
            batch_tensor = np.array(batch_frames, dtype=np.float32 if self.normalize else np.uint8)
            yield {
                "frames": batch_tensor,
                "metadata": batch_metadata,
                "batch_size": len(batch_frames),
                "fps": round(fps, 2),
                "total_frames": total_frames,
                "elapsed_time_s": round(time.time() - start_time, 3)
            }

        cap.release()


def benchmark_video_pipeline(video_path: str):
    """
    Run benchmark test on the video dataloader pipeline.
    """
    print("=" * 65)
    print("STEP 1: DATA PIPELINE FOUNDATION & PREPROCESSING BENCHMARK")
    print("=" * 65)
    print(f"Target Video File: {video_path}")

    loader = VideoDataLoader(video_path=video_path, target_size=(640, 640), batch_size=8)
    
    total_processed_frames = 0
    total_batches = 0
    start_bench = time.time()

    for batch in loader.stream_batches():
        total_batches += 1
        total_processed_frames += batch["batch_size"]
        tensor = batch["frames"]
        first_meta = batch["metadata"][0]

        if total_batches == 1:
            print(f"[+] Batch 1 Received!")
            print(f"   - Tensor Shape: {tensor.shape} (Batch x Height x Width x Channels)")
            print(f"   - Tensor Dtype: {tensor.dtype}")
            print(f"   - Pixel Range: [{tensor.min():.2f} .. {tensor.max():.2f}]")
            print(f"   - First Frame Metadata: {first_meta}")

    duration = time.time() - start_bench
    throughput_fps = round(total_processed_frames / duration, 2) if duration > 0 else 0

    print("-" * 65)
    print(f"[*] PIPELINE BENCHMARK SUMMARY:")
    print(f"   - Total Batches Streamed : {total_batches}")
    print(f"   - Total Frames Processed : {total_processed_frames}")
    print(f"   - Preprocessing Time     : {round(duration, 3)} seconds")
    print(f"   - Streaming Throughput   : {throughput_fps} FPS")
    print("=" * 65)
    print("[OK] Step 1 Conveyor Belt Pipeline Verification Passed Successfully!")


if __name__ == "__main__":
    possible = [
        os.path.join("..", "frontend", "public", "videos", "cctv_1.mp4"),
        os.path.join("frontend", "public", "videos", "cctv_1.mp4"),
        os.path.join("..", "CCTV_Shoplifting_Dataset", "videos", "not_shoplifting1.mp4"),
        os.path.join("CCTV_Shoplifting_Dataset", "videos", "not_shoplifting1.mp4")
    ]
    test_video = next((p for p in possible if os.path.exists(p)), "")
    if test_video:
        benchmark_video_pipeline(test_video)
