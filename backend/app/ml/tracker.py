import numpy as np
from scipy.optimize import linear_sum_assignment
from typing import List, Dict, Any

def calc_iou(box1: List[float], box2: List[float]) -> float:
    x1 = max(box1[0], box2[0])
    y1 = max(box1[1], box2[1])
    x2 = min(box1[2], box2[2])
    y2 = min(box1[3], box2[3])
    
    inter_area = max(0.0, x2 - x1) * max(0.0, y2 - y1)
    box1_area = (box1[2] - box1[0]) * (box1[3] - box1[1])
    box2_area = (box2[2] - box2[0]) * (box2[3] - box2[1])
    
    union_area = box1_area + box2_area - inter_area
    if union_area <= 0.0:
        return 0.0
    return inter_area / union_area

class STrack:
    def __init__(self, bbox: List[float], score: float, cls_name: str = "person"):
        self.bbox = bbox  # [x1, y1, x2, y2]
        self.score = score
        self.cls_name = cls_name
        self.track_id = None
        self.state = "tracked"  # "tracked" | "lost" | "removed"
        self.is_activated = False
        self.frame_id = 0
        self.tracklet_len = 0
        self.velocity = np.zeros(4) # [vx1, vy1, vx2, vy2] to handle motion prediction

    def activate(self, track_id: str, frame_id: int):
        self.track_id = track_id
        self.state = "tracked"
        self.is_activated = True
        self.frame_id = frame_id
        self.tracklet_len = 1
        self.velocity = np.zeros(4)

    def re_activate(self, new_track: 'STrack', frame_id: int):
        self.velocity = np.array(new_track.bbox) - np.array(self.bbox)
        self.bbox = new_track.bbox
        self.score = new_track.score
        self.state = "tracked"
        self.frame_id = frame_id
        self.tracklet_len += 1

    def update(self, new_track: 'STrack', frame_id: int):
        self.velocity = np.array(new_track.bbox) - np.array(self.bbox)
        self.bbox = new_track.bbox
        self.score = new_track.score
        self.state = "tracked"
        self.frame_id = frame_id
        self.tracklet_len += 1

    def predict(self) -> List[float]:
        # Predict the next bounding box based on estimated constant velocity
        pred = np.array(self.bbox) + self.velocity
        return list(pred)

    def mark_lost(self):
        self.state = "lost"

    def mark_removed(self):
        self.state = "removed"

class ByteTracker:
    def __init__(self, track_thresh: float = 0.5, match_thresh: float = 0.8, max_time_lost: int = 30, min_thresh: float = 0.1):
        self.track_thresh = track_thresh
        self.match_thresh = match_thresh
        self.max_time_lost = max_time_lost
        self.min_thresh = min_thresh
        
        self.tracked_stracks: List[STrack] = []
        self.lost_stracks: List[STrack] = []
        self.next_id = 1
        self.frame_id = 0

    def update(self, detections: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        self.frame_id += 1
        
        # 1. Filter detections
        high_detections: List[STrack] = []
        low_detections: List[STrack] = []
        
        for det in detections:
            bbox = det["bbox"]
            score = det["confidence"]
            cls_name = det.get("class", "person")
            
            strack = STrack(bbox, score, cls_name)
            if score >= self.track_thresh:
                high_detections.append(strack)
            elif score >= self.min_thresh:
                low_detections.append(strack)
                
        # Split tracked tracks into active/lost pools
        active_tracked: List[STrack] = []
        unconfirmed: List[STrack] = []
        
        for t in self.tracked_stracks:
            if not t.is_activated:
                unconfirmed.append(t)
            else:
                active_tracked.append(t)
                
        # Pool containing active + lost tracks
        strack_pool = active_tracked + self.lost_stracks
        
        # 2. First association with high score detections using motion predicted positions
        cost_matrix = self._get_cost_matrix(strack_pool, high_detections)
        matches, unmatched_tracks, unmatched_high_dets = self._linear_assignment(cost_matrix, self.match_thresh)
        
        # Process matches from first association
        for t_idx, d_idx in matches:
            track = strack_pool[t_idx]
            det = high_detections[d_idx]
            if track.state == "tracked":
                track.update(det, self.frame_id)
            else:
                track.re_activate(det, self.frame_id)
                
        # 3. Second association: low score detections with remaining tracks
        remaining_tracks = [strack_pool[i] for i in unmatched_tracks if strack_pool[i].state == "tracked"]
        cost_matrix_low = self._get_cost_matrix(remaining_tracks, low_detections)
        matches_low, unmatched_tracks_low, _ = self._linear_assignment(cost_matrix_low, 0.9) # high threshold for low score match fallback
        
        for t_idx, d_idx in matches_low:
            track = remaining_tracks[t_idx]
            det = low_detections[d_idx]
            if track.state == "tracked":
                track.update(det, self.frame_id)
            else:
                track.re_activate(det, self.frame_id)
                
        # Mark lost tracks
        for t_idx in unmatched_tracks_low:
            track = remaining_tracks[t_idx]
            if track.state != "lost":
                track.mark_lost()
                
        # 4. Handle unconfirmed tracks (associate with unmatched high detections)
        cost_matrix_unconfirmed = self._get_cost_matrix(unconfirmed, [high_detections[i] for i in unmatched_high_dets])
        matches_unconf, unmatched_unconf, unmatched_high_dets_unconf = self._linear_assignment(cost_matrix_unconfirmed, 0.9)
        
        for t_idx, d_idx in matches_unconf:
            track = unconfirmed[t_idx]
            det = high_detections[unmatched_high_dets[d_idx]]
            track.update(det, self.frame_id)
            track.is_activated = True
            
        for t_idx in unmatched_unconf:
            track = unconfirmed[t_idx]
            track.mark_removed()
            
        # 5. Initialize new tracks from remaining unmatched high detections
        new_tracked = []
        for idx in unmatched_high_dets_unconf:
            det = high_detections[unmatched_high_dets[idx]]
            det.activate(str(self.next_id), self.frame_id)
            self.next_id += 1
            new_tracked.append(det)
            
        # Update tracked and lost tracks lists
        next_tracked = []
        next_lost = []
        
        for t in self.tracked_stracks:
            if t.state == "tracked":
                next_tracked.append(t)
            elif t.state == "lost":
                # Expire tracks that exceed max_time_lost
                if self.frame_id - t.frame_id > self.max_time_lost:
                    t.mark_removed()
                else:
                    next_lost.append(t)
                    
        for t in self.lost_stracks:
            if t.state == "tracked":
                next_tracked.append(t)
            elif t.state == "lost":
                if self.frame_id - t.frame_id > self.max_time_lost:
                    t.mark_removed()
                else:
                    next_lost.append(t)
                    
        # Append new tracks
        for t in new_tracked:
            next_tracked.append(t)
            
        self.tracked_stracks = next_tracked
        self.lost_stracks = next_lost
        
        # Build return payload
        tracked_objects = []
        for t in self.tracked_stracks:
            if t.is_activated and t.state == "tracked":
                tracked_objects.append({
                    "track_id": t.track_id,
                    "class": t.cls_name,
                    "bbox": t.bbox,
                    "confidence": t.score
                })
                
        return tracked_objects

    def _get_cost_matrix(self, tracks: List[STrack], detections: List[STrack]) -> np.ndarray:
        if len(tracks) == 0 or len(detections) == 0:
            return np.empty((len(tracks), len(detections)))
            
        cost = np.zeros((len(tracks), len(detections)), dtype=np.float32)
        for i, t in enumerate(tracks):
            # Use predicted bounding box rather than current bounding box to compute IoU
            pred_box = t.predict()
            for j, d in enumerate(detections):
                cost[i, j] = 1.0 - calc_iou(pred_box, d.bbox)
        return cost

    def _linear_assignment(self, cost_matrix: np.ndarray, thresh: float) -> tuple:
        if cost_matrix.size == 0:
            return [], list(range(cost_matrix.shape[0])), list(range(cost_matrix.shape[1]))
            
        row_ind, col_ind = linear_sum_assignment(cost_matrix)
        matches = []
        unmatched_a = []
        unmatched_b = []
        
        for r, c in zip(row_ind, col_ind):
            if cost_matrix[r, c] > thresh:
                unmatched_a.append(r)
                unmatched_b.append(c)
            else:
                matches.append((r, c))
                
        for r in range(cost_matrix.shape[0]):
            if r not in row_ind:
                unmatched_a.append(r)
        for c in range(cost_matrix.shape[1]):
            if c not in col_ind:
                unmatched_b.append(c)
                
        return matches, unmatched_a, unmatched_b
