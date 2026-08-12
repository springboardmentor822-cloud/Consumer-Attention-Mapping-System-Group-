"""
tracker.py
----------
Customer tracking module for Consumer Attention Mapping System.
Implements real tracking state management based on YOLOv8/ByteTrack outputs.
"""

import time
import math
from collections import defaultdict
from typing import List, Dict, Tuple, Any

class RealTracker:
    """
    Manages real customer tracking state from YOLO/ByteTrack detections.
    Tracks entry/exit, dwell time per zone, and attention scores.
    """
    def __init__(self):
        # State tracking
        self.entry_times: Dict[int, float] = {}       # track_id -> first seen timestamp
        self.last_seen: Dict[int, float] = {}         # track_id -> last seen timestamp
        self.track_zones: Dict[int, Dict[str, float]] = defaultdict(lambda: defaultdict(float)) # track_id -> zone_name -> dwell_time
        
        # New State tracking for Attention Analytics
        self.attention_times: Dict[int, float] = defaultdict(float) # track_id -> total time spent browsing
        self.first_browsing_time: Dict[int, float] = {} # track_id -> timestamp when they first started browsing
        self.last_positions: Dict[int, Tuple[int, int]] = {} # track_id -> (cx, cy) of previous frame for velocity
        
        # Analytics metrics
        self.total_entries = 0
        self.total_exits = 0
        self.total_browsers = 0 
        self.total_abandoned = 0
        self.heatmap_data: List[List[int]] = []       # [x, y, intensity]
        
        # Paths for drawing (kept small to prevent memory leak)
        self.paths: Dict[int, List[Tuple[int, int]]] = defaultdict(list)
        
        # Active tracks in the current frame
        self.current_active_ids = set()
        
        # Mapping y-coordinates to generic zones (can be improved)
        # Using 3 zones to match the DB seeds: Produce Section, Bakery, Snacks aisle
        self.ZONE_BOUNDS = [
            (0, 160, "Produce Section"),
            (160, 320, "Bakery"),
            (320, 1000, "Snacks aisle"),
        ]

    def _get_zone(self, y: int) -> str:
        for min_y, max_y, name in self.ZONE_BOUNDS:
            if min_y <= y < max_y:
                return name
        return "Unknown"

    def update(self, track_ids: List[int], bboxes: List[List[float]], frame_width: int, frame_height: int, heatmap_enabled: bool = False):
        """
        Process a single frame's tracks.
        track_ids: List of integer IDs from ByteTrack
        bboxes: List of [x1, y1, x2, y2]
        """
        current_time = time.time()
        self.current_active_ids = set(track_ids)
        
        for track_id, bbox in zip(track_ids, bboxes):
            if track_id not in self.entry_times:
                self.entry_times[track_id] = current_time
                self.total_entries += 1
            
            x1, y1, x2, y2 = bbox
            cx, cy = int((x1 + x2) / 2), int((y1 + y2) / 2)
            
            # Update path
            self.paths[track_id].append((cx, cy))
            if len(self.paths[track_id]) > 50:
                self.paths[track_id].pop(0)
                
            # Update heatmap
            if heatmap_enabled:
                self._update_heatmap(cx, cy)
                
            # Dwell time calculation
            time_since_last = current_time - self.last_seen.get(track_id, current_time)
            # Ensure we don't add massive gaps if the track was lost and regained after a long time
            if time_since_last > 0 and time_since_last < 5.0:
                zone_name = self._get_zone(cy)
                self.track_zones[track_id][zone_name] += time_since_last
                
                # Velocity-based attention heuristic
                is_browsing = False
                if track_id in self.last_positions:
                    last_cx, last_cy = self.last_positions[track_id]
                    dist = math.hypot(cx - last_cx, cy - last_cy)
                    # If they moved less than 15 pixels in this frame delta, consider them browsing
                    if dist < 15:
                        self.attention_times[track_id] += time_since_last
                        is_browsing = True
                        
                if is_browsing and track_id not in self.first_browsing_time:
                    self.first_browsing_time[track_id] = current_time
                    self.total_browsers += 1

            self.last_positions[track_id] = (cx, cy)
            self.last_seen[track_id] = current_time
            
        # Cleanup stale tracks (exit detection)
        # We consider a track exited if not seen for 10 seconds
        stale_ids = []
        for tid, last_t in self.last_seen.items():
            if current_time - last_t > 10.0 and tid not in self.current_active_ids:
                stale_ids.append(tid)
                
        for tid in stale_ids:
            self.total_exits += 1
            # We don't delete them from entry_times/track_zones here if we want historical session stats, 
            # but in a long-running app we should pop them and perhaps return them to be saved to DB.
            # To avoid memory leaks, we will return the finalized track data and remove them.

        exited_tracks = []
        for tid in stale_ids:
            dwell = current_time - self.entry_times[tid]
            zones = self.track_zones[tid]
            attn_time = self.attention_times.get(tid, 0)
            
            # Check abandonment: Dwelled > 10s or actually browsed, but very low attention
            if dwell > 10.0 and attn_time < 5.0:
                 self.total_abandoned += 1

            exited_tracks.append({
                "track_id": tid,
                "total_dwell": dwell,
                "attention_time": attn_time,
                "zones": dict(zones)
            })
            del self.entry_times[tid]
            del self.last_seen[tid]
            del self.track_zones[tid]
            if tid in self.paths:
                del self.paths[tid]
            if tid in self.attention_times:
                del self.attention_times[tid]
            if tid in self.first_browsing_time:
                del self.first_browsing_time[tid]
            if tid in self.last_positions:
                del self.last_positions[tid]
                
        return exited_tracks

    def get_active_tracks_data(self) -> List[Dict]:
        """Return data for currently active tracks."""
        current_time = time.time()
        tracks = []
        for tid in self.current_active_ids:
            if tid in self.entry_times:
                dwell = current_time - self.entry_times[tid]
                attn_time = self.attention_times.get(tid, 0.0)
                
                # Attention score is percentage of dwell time spent browsing
                attn_score = min(100, int((attn_time / max(dwell, 1.0)) * 100))
                
                cx, cy = self.paths[tid][-1] if self.paths[tid] else (0, 0)
                zone = self._get_zone(cy)
                
                state = "Walking"
                if tid in self.last_positions:
                     last_cx, last_cy = self.last_positions[tid]
                     if math.hypot(cx - last_cx, cy - last_cy) < 15:
                         state = "Browsing"

                # Time to notice logic
                time_to_notice = 0.0
                if tid in self.first_browsing_time:
                     time_to_notice = self.first_browsing_time[tid] - self.entry_times[tid]
                
                tracks.append({
                    "track_id": tid,
                    "x": cx,
                    "y": cy,
                    "state": state,
                    "dwell_time": dwell,
                    "attention_time": attn_time,
                    "time_to_notice": time_to_notice,
                    "attention_score": attn_score,
                    "zone": zone,
                    "total_time": dwell,
                    "product_interactions": int(attn_time / 10),
                    "shelf_engagement": attn_time
                })
        return tracks

    def get_analytics(self) -> Dict[str, Any]:
        """Return real retail analytics snapshot."""
        current_time = time.time()
        
        # Calculate zone dwell times for currently active tracks + historical
        # We'll approximate this by summing all active track zones
        zone_dwell: Dict[str, float] = defaultdict(float)
        zone_visits: Dict[str, int] = defaultdict(int)
        
        for tid, zones in self.track_zones.items():
            for z, d in zones.items():
                zone_dwell[z] += d
                zone_visits[z] += 1
                
        tracks = self.get_active_tracks_data()
        current_occupancy = len(tracks)

        avg_dwell = (sum(t["dwell_time"] for t in tracks) / len(tracks)) if tracks else 0.0
        avg_attention_score = (sum(t["attention_score"] for t in tracks) / len(tracks)) if tracks else 0.0
        avg_attention_time = (sum(t["attention_time"] for t in tracks) / len(tracks)) if tracks else 0.0
        avg_time_to_notice = (sum(t["time_to_notice"] for t in tracks if t["time_to_notice"] > 0) / max(1, len([t for t in tracks if t["time_to_notice"] > 0])))
        
        capture_rate = (self.total_browsers / max(1, self.total_entries)) * 100 if self.total_entries > 0 else 0.0
        abandonment_rate = (self.total_abandoned / max(1, self.total_entries)) * 100 if self.total_entries > 0 else 0.0
        
        most_visited_zone = max(zone_visits, key=zone_visits.get) if zone_visits else "N/A"
        total_shelf_engagement = sum(zone_dwell.values())

        return {
            "current_customers": current_occupancy,
            "total_entries": self.total_entries,
            "total_exits": self.total_exits,
            "average_dwell_time": round(avg_dwell, 1),
            "average_attention_time": round(avg_attention_time, 1),
            "average_time_to_notice": round(avg_time_to_notice, 1),
            "average_attention_score": round(avg_attention_score, 1),
            "capture_rate": round(capture_rate, 1),
            "abandonment_rate": round(abandonment_rate, 1),
            "most_visited_zone": most_visited_zone,
            "zone_dwell_times": dict(zone_dwell),
            "zone_visit_counts": dict(zone_visits),
            "total_shelf_engagement": round(total_shelf_engagement, 1),
            "heatmap_points": self.heatmap_data[:50],  # cap payload size
            "active_tracks": tracks,
        }

    def _update_heatmap(self, x: int, y: int):
        """Accumulate heat at position (x, y)."""
        for hp in self.heatmap_data:
            if abs(hp[0] - x) < 30 and hp[1] == y:
                hp[2] = min(100, hp[2] + 2)
                return
        self.heatmap_data.append([x, y, 10])
