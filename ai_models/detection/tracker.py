"""
A minimal centroid-distance tracker: matches each frame's detections to
existing tracks by nearest centroid within a distance threshold, creates
new track IDs for unmatched detections, and drops tracks that go
unmatched for too many consecutive frames.

This is intentionally simple (no motion model, no re-identification) —
it's the pairing used with HOGPersonDetector for sandbox testing. The
production path (YOLOv8Detector.track()) uses ByteTrack instead, which
is far more robust to occlusion and fast motion; swap to that in a real
deployment. This tracker exists so the pipeline is fully testable without
external model weights.
"""
from __future__ import annotations

from dataclasses import dataclass, field

from ai_models.detection.detector import Detection


@dataclass
class Track:
    track_id: int
    detection: Detection
    frames_since_seen: int = 0
    age: int = 0


class CentroidTracker:
    def __init__(self, max_disappeared: int = 10, max_distance: float = 80.0):
        self.max_disappeared = max_disappeared
        self.max_distance = max_distance
        self._next_id = 1
        self.tracks: dict[int, Track] = {}

    @staticmethod
    def _centroid(det: Detection) -> tuple[float, float]:
        return (det.x + det.w / 2, det.y + det.h / 2)

    def update(self, detections: list[Detection]) -> dict[int, Detection]:
        if not detections:
            for track in list(self.tracks.values()):
                track.frames_since_seen += 1
                if track.frames_since_seen > self.max_disappeared:
                    del self.tracks[track.track_id]
            return {tid: t.detection for tid, t in self.tracks.items()}

        unmatched_detections = list(range(len(detections)))
        unmatched_tracks = list(self.tracks.keys())
        matches: list[tuple[int, int]] = []  # (track_id, detection_index)

        if self.tracks:
            det_centroids = [self._centroid(d) for d in detections]
            track_ids = list(self.tracks.keys())
            track_centroids = [self._centroid(self.tracks[tid].detection) for tid in track_ids]

            # greedy nearest-neighbor matching
            pairs = []
            for ti, tc in enumerate(track_centroids):
                for di, dc in enumerate(det_centroids):
                    dist = ((tc[0] - dc[0]) ** 2 + (tc[1] - dc[1]) ** 2) ** 0.5
                    if dist <= self.max_distance:
                        pairs.append((dist, track_ids[ti], di))
            pairs.sort(key=lambda p: p[0])

            used_tracks: set[int] = set()
            used_dets: set[int] = set()
            for _, tid, di in pairs:
                if tid in used_tracks or di in used_dets:
                    continue
                matches.append((tid, di))
                used_tracks.add(tid)
                used_dets.add(di)

            unmatched_detections = [i for i in range(len(detections)) if i not in used_dets]
            unmatched_tracks = [tid for tid in track_ids if tid not in used_tracks]

        for tid, di in matches:
            self.tracks[tid].detection = detections[di]
            self.tracks[tid].frames_since_seen = 0
            self.tracks[tid].age += 1

        for tid in unmatched_tracks:
            self.tracks[tid].frames_since_seen += 1
            if self.tracks[tid].frames_since_seen > self.max_disappeared:
                del self.tracks[tid]

        for di in unmatched_detections:
            self.tracks[self._next_id] = Track(track_id=self._next_id, detection=detections[di])
            self._next_id += 1

        return {tid: t.detection for tid, t in self.tracks.items()}
