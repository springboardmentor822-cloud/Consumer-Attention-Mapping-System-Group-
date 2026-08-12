"""
live_analytics.py
-----------------
Global live analytics state for Consumer Attention Mapping System.
Maintains independent tracking instances per camera.
"""

import threading
from typing import Dict, Any, List
from app.ai.tracker import RealTracker

_camera_trackers: Dict[int, RealTracker] = {}
_camera_products: Dict[int, int] = {}
_camera_fps: Dict[int, float] = {}
_lock = threading.RLock()


def _get_or_create_tracker(camera_id: int) -> RealTracker:
    if camera_id not in _camera_trackers:
        _camera_trackers[camera_id] = RealTracker()
    return _camera_trackers[camera_id]


def update_live_tracker(camera_id: int, tracker: RealTracker, current_count: int = -1, current_products: int = 0, fps: float = 0.0):
    """
    Synchronize live tracking metrics & product counts into the specific camera tracker.
    """
    try:
        with _lock:
            t = _get_or_create_tracker(camera_id)
            t.total_entries = tracker.total_entries
            t.total_exits = tracker.total_exits
            t.heatmap_data = list(tracker.heatmap_data)
            t.track_zones = dict(tracker.track_zones)
            t.entry_times = dict(tracker.entry_times)
            t.last_seen = dict(tracker.last_seen)
            t.paths = dict(tracker.paths)
            t.current_active_ids = set(tracker.current_active_ids)
            
            t.current_customers = current_count if current_count >= 0 else len(tracker.current_active_ids)
            _camera_products[camera_id] = current_products
            _camera_fps[camera_id] = fps
    except Exception as e:
        print(f"Warning in update_live_tracker: {e}")


def get_camera_analytics(camera_id: int) -> Dict[str, Any]:
    """
    Return a snapshot of the current live analytics state for a specific camera.
    """
    with _lock:
        if camera_id not in _camera_trackers:
            return {
                "current_customers": 0,
                "total_entries": 0,
                "total_exits": 0,
                "average_dwell_time": 0.0,
                "average_attention_score": 0.0,
                "average_attention_time": 0.0,
                "average_time_to_notice": 0.0,
                "capture_rate": 0.0,
                "abandonment_rate": 0.0,
                "most_visited_zone": "N/A",
                "zone_dwell_times": {},
                "zone_visit_counts": {},
                "total_shelf_engagement": 0.0,
                "heatmap_points": [],
                "active_tracks": [],
                "current_products": 0,
                "fps": 0.0
            }
        
        tracker = _camera_trackers[camera_id]
        prod_cnt = _camera_products.get(camera_id, 0)
        fps_cnt = _camera_fps.get(camera_id, 0.0)

    try:
        analytics = tracker.get_analytics()
    except Exception:
        analytics = {
            "current_customers": 0,
            "total_entries": 0,
            "total_exits": 0,
            "average_dwell_time": 0.0,
            "heatmap_points": [],
            "active_tracks": []
        }

    if hasattr(tracker, 'current_customers'):
        analytics["current_customers"] = tracker.current_customers
    analytics["current_products"] = prod_cnt
    analytics["fps"] = fps_cnt
    return analytics


def get_all_trackers() -> Dict[int, RealTracker]:
    with _lock:
        return dict(_camera_trackers)
        
def get_all_products() -> Dict[int, int]:
    with _lock:
        return dict(_camera_products)

# Backwards compatibility fallback for standalone scripts (if any)
def update_live_analytics(ids, boxes, frame_width: int = 1920, frame_height: int = 1080):
    camera_id = 0 # Default standalone ID
    with _lock:
        t = _get_or_create_tracker(camera_id)
        t.update(
            track_ids=ids,
            bboxes=boxes,
            frame_width=frame_width,
            frame_height=frame_height,
            heatmap_enabled=True,
        )
        t.current_customers = len(ids)

def get_live_analytics():
    return get_camera_analytics(0)