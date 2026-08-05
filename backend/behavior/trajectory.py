"""
trajectory.py

Milestone 3
Phase 1
Step 1 - Trajectory Engine

Purpose
-------
Provides trajectory analytics using the customer_paths collected
inside ai_detector.py.

This module DOES NOT perform detection.

It only analyses existing tracking data.
"""

from math import sqrt
from typing import Dict, List, Tuple

Point = Tuple[int, int]


class TrajectoryEngine:

    def __init__(self):
        pass

    # ----------------------------------------------------
    # Total Distance Travelled
    # ----------------------------------------------------

    def total_distance(self, path: List[Point]) -> float:

        if len(path) < 2:
            return 0.0

        distance = 0.0

        for i in range(1, len(path)):

            x1, y1 = path[i - 1]
            x2, y2 = path[i]

            distance += sqrt(
                (x2 - x1) ** 2 +
                (y2 - y1) ** 2
            )

        return round(distance, 2)

    # ----------------------------------------------------
    # Average Speed
    # ----------------------------------------------------

    def average_speed(
        self,
        path: List[Point],
        fps: float = 30.0
    ) -> float:

        if len(path) < 2:
            return 0.0

        time_seconds = len(path) / fps

        if time_seconds == 0:
            return 0.0

        speed = self.total_distance(path) / time_seconds

        return round(speed, 2)

    # ----------------------------------------------------
    # Start Position
    # ----------------------------------------------------

    def start_position(
        self,
        path: List[Point]
    ):

        if not path:
            return None

        return path[0]

    # ----------------------------------------------------
    # End Position
    # ----------------------------------------------------

    def end_position(
        self,
        path: List[Point]
    ):

        if not path:
            return None

        return path[-1]

    # ----------------------------------------------------
    # Number of Path Points
    # ----------------------------------------------------

    def path_points(
        self,
        path: List[Point]
    ):

        return len(path)

    # ----------------------------------------------------
    # Straight Line Distance
    # ----------------------------------------------------

    def displacement(
        self,
        path: List[Point]
    ):

        if len(path) < 2:
            return 0.0

        x1, y1 = path[0]
        x2, y2 = path[-1]

        return round(
            sqrt(
                (x2 - x1) ** 2 +
                (y2 - y1) ** 2
            ),
            2,
        )

    # ----------------------------------------------------
    # Movement Efficiency
    # ----------------------------------------------------

    def movement_efficiency(
        self,
        path: List[Point]
    ):

        total = self.total_distance(path)

        if total == 0:
            return 0.0

        efficiency = (
            self.displacement(path)
            / total
        )

        return round(efficiency, 2)

    # ----------------------------------------------------
    # Full Summary
    # ----------------------------------------------------

    def summary(
        self,
        track_id: int,
        path: List[Point]
    ):

        return {

            "track_id": track_id,

            "path_points":
                self.path_points(path),

            "start_position":
                self.start_position(path),

            "end_position":
                self.end_position(path),

            "distance":
                self.total_distance(path),

            "average_speed":
                self.average_speed(path),

            "displacement":
                self.displacement(path),

            "movement_efficiency":
                self.movement_efficiency(path),
        }


trajectory_engine = TrajectoryEngine()


# --------------------------------------------------------
# Helper Function
# --------------------------------------------------------

def analyse_customer_paths(customer_paths):

    report = {}

    for track_id, path in customer_paths.items():

        report[track_id] = trajectory_engine.summary(
            track_id,
            path,
        )

    return report