#!/usr/bin/env python3
"""
Consumer Attention Mapping System - Video Intake Processor
Optimizes video streams to 5 FPS for memory efficiency
"""

import cv2
import time
import json
import numpy as np
from datetime import datetime
import threading
import queue
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class VideoStreamProcessor:
    """
    Handles video intake from camera sources and optimizes to 5 FPS
    """
    
    def __init__(self, source=0, target_fps=5, max_queue_size=10):
        self.source = source
        self.target_fps = target_fps
        self.frame_interval = 1.0 / target_fps
        self.running = False
        self.frame_queue = queue.Queue(maxsize=max_queue_size)
        self.stats = {
            'total_frames_processed': 0,
            'dropped_frames': 0,
            'fps_actual': 0,
            'start_time': None
        }
        
    def start(self):
        """Start video processing thread"""
        self.running = True
        self.stats['start_time'] = time.time()
        self.thread = threading.Thread(target=self._process_stream)
        self.thread.daemon = True
        self.thread.start()
        logger.info(f"Video stream started from source: {self.source} at {self.target_fps} FPS")
        
    def stop(self):
        """Stop video processing"""
        self.running = False
        if hasattr(self, 'thread'):
            self.thread.join(timeout=2)
        logger.info("Video stream stopped")
        
    def _process_stream(self):
        """Main video processing loop optimized to target FPS"""
        cap = cv2.VideoCapture(self.source)
        
        if not cap.isOpened():
            logger.error(f"Failed to open video source: {self.source}")
            return
            
        # Set camera properties for optimization
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)  # Reduce buffer
        
        last_process_time = time.time()
        frame_count = 0
        
        logger.info(f"Processing video at {self.target_fps} FPS (interval: {self.frame_interval:.3f}s)")
        
        while self.running:
            ret, frame = cap.read()
            
            if not ret:
                logger.warning("Failed to read frame, reconnecting...")
                cap.release()
                time.sleep(1)
                cap = cv2.VideoCapture(self.source)
                continue
                
            current_time = time.time()
            elapsed = current_time - last_process_time
            
            # Only process frame if enough time has passed (target FPS)
            if elapsed >= self.frame_interval:
                # Process frame
                processed_frame = self._process_frame(frame)
                
                # Add to queue with timestamp
                try:
                    self.frame_queue.put_nowait({
                        'frame': processed_frame,
                        'timestamp': current_time,
                        'frame_number': frame_count
                    })
                except queue.Full:
                    self.stats['dropped_frames'] += 1
                    logger.warning(f"Queue full, dropping frame {frame_count}")
                
                last_process_time = current_time
                frame_count += 1
                self.stats['total_frames_processed'] += 1
                
                # Update actual FPS every 30 frames
                if frame_count % 30 == 0:
                    actual_fps = frame_count / (time.time() - self.stats['start_time'])
                    self.stats['fps_actual'] = actual_fps
                    logger.info(f"Actual FPS: {actual_fps:.2f}, Total frames: {frame_count}, Dropped: {self.stats['dropped_frames']}")
                    
            else:
                # Small sleep to prevent busy loop
                time.sleep(0.001)
                
        cap.release()
        logger.info(f"Video processing finished. Total frames: {frame_count}")
        
    def _process_frame(self, frame):
        """
        Process individual frame - resize, convert, add overlay
        """
        # Resize to standard resolution (memory optimization)
        frame = cv2.resize(frame, (640, 480))
        
        # Convert to RGB (for AI models)
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Add overlay with timestamp and FPS
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cv2.putText(frame, f"Time: {timestamp}", (10, 30), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        cv2.putText(frame, f"FPS: {self.target_fps}", (10, 60), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        
        return frame
        
    def get_frame(self, timeout=1.0):
        """Get latest processed frame from queue"""
        try:
            frame_data = self.frame_queue.get(timeout=timeout)
            return frame_data
        except queue.Empty:
            return None
            
    def get_stats(self):
        """Get processing statistics"""
        elapsed = time.time() - self.stats['start_time'] if self.stats['start_time'] else 0
        return {
            **self.stats,
            'elapsed_seconds': elapsed,
            'queue_size': self.frame_queue.qsize(),
            'target_fps': self.target_fps
        }


class MultiCameraManager:
    """Manages multiple video streams"""
    
    def __init__(self):
        self.processors = {}
        self.running = False
        
    def add_camera(self, camera_id, source=0, target_fps=5):
        """Add a new camera stream"""
        if camera_id in self.processors:
            logger.warning(f"Camera {camera_id} already exists")
            return
            
        processor = VideoStreamProcessor(source, target_fps)
        self.processors[camera_id] = processor
        if self.running:
            processor.start()
        logger.info(f"Added camera {camera_id} from source {source}")
        
    def remove_camera(self, camera_id):
        """Remove a camera stream"""
        if camera_id in self.processors:
            self.processors[camera_id].stop()
            del self.processors[camera_id]
            logger.info(f"Removed camera {camera_id}")
            
    def start_all(self):
        """Start all camera streams"""
        self.running = True
        for processor in self.processors.values():
            processor.start()
        logger.info(f"Started all {len(self.processors)} camera streams")
        
    def stop_all(self):
        """Stop all camera streams"""
        self.running = False
        for processor in self.processors.values():
            processor.stop()
        logger.info("Stopped all camera streams")
        
    def get_frame(self, camera_id, timeout=1.0):
        """Get frame from specific camera"""
        if camera_id in self.processors:
            return self.processors[camera_id].get_frame(timeout)
        return None
        
    def get_all_stats(self):
        """Get stats for all cameras"""
        return {cam_id: proc.get_stats() for cam_id, proc in self.processors.items()}


def main():
    """Example usage of video processor"""
    
    # Create camera manager
    manager = MultiCameraManager()
    
    # Add cameras (0 = default webcam)
    manager.add_camera('CAM001', source=0, target_fps=5)
    
    # Start all cameras
    manager.start_all()
    
    try:
        # Process frames for 30 seconds
        start_time = time.time()
        while time.time() - start_time < 30:
            # Get frame from CAM001
            frame_data = manager.get_frame('CAM001', timeout=0.1)
            
            if frame_data:
                # Display frame
                cv2.imshow('Consumer Attention Mapping - CAM001', frame_data['frame'])
                
                # Print stats every second
                if int(time.time()) % 2 == 0:
                    stats = manager.get_all_stats()
                    for cam_id, stat in stats.items():
                        print(f"Camera {cam_id}: {stat}")
                        
            # Press 'q' to quit
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
                
    except KeyboardInterrupt:
        print("\nInterrupted by user")
        
    finally:
        cv2.destroyAllWindows()
        manager.stop_all()
        print("Video processing terminated")


if __name__ == "__main__":
    # Install required packages:
    # pip install opencv-python numpy
    
    main()