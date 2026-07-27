from __future__ import annotations

import math
import unittest

from app.ml.attention import (
    DwellEventKind,
    DwellEventStateMachine,
    DwellObservation,
    ShelfPlane,
    gaze_vector_from_head_pose,
    map_gaze_to_shelf,
    ray_plane_intersection,
)
from app.ml.errors import MLConfigurationError


class GazeGeometryTests(unittest.TestCase):
    def test_head_pose_convention_and_ray_plane_hit(self) -> None:
        self.assertEqual(gaze_vector_from_head_pose(0, 0), (0.0, 0.0, 1.0))
        looking_right = gaze_vector_from_head_pose(90, 0)
        self.assertAlmostEqual(looking_right[0], 1.0, places=7)
        self.assertAlmostEqual(looking_right[2], 0.0, places=7)

        hit = ray_plane_intersection((0, 0, 0), (0, 0, 1), (0, 0, 5), (0, 0, -1))
        self.assertIsNotNone(hit)
        point, distance = hit  # type: ignore[misc]
        self.assertEqual(point, (0.0, 0.0, 5.0))
        self.assertEqual(distance, 5.0)

    def test_nearest_shelf_rectangle_wins(self) -> None:
        shelves = [
            ShelfPlane("near", (0, 0, 4), (0, 0, -1), (0, -1, 0), 2, 2, "sku-1"),
            ShelfPlane("far", (0, 0, 8), (0, 0, -1), (0, -1, 0), 4, 4, "sku-2"),
        ]
        hit = map_gaze_to_shelf((0, 0, 0), (0, 0, 1), shelves)
        self.assertIsNotNone(hit)
        self.assertEqual(hit.shelf_id, "near")  # type: ignore[union-attr]
        self.assertEqual(hit.product_id, "sku-1")  # type: ignore[union-attr]
        self.assertTrue(math.isclose(hit.incidence, 1.0))  # type: ignore[union-attr]

        miss = map_gaze_to_shelf((5, 0, 0), (0, 0, 1), shelves)
        self.assertIsNone(miss)


class DwellStateMachineTests(unittest.TestCase):
    def test_threshold_grace_and_single_end_event(self) -> None:
        machine = DwellEventStateMachine(
            minimum_dwell_seconds=1.0,
            exit_grace_seconds=0.6,
            minimum_confidence=0.5,
        )
        self.assertEqual(machine.update(DwellObservation("s1", 0.0, "shelf-a", 0.8)), ())
        self.assertEqual(machine.update(DwellObservation("s1", 0.5, "shelf-a", 0.9)), ())
        started = machine.update(DwellObservation("s1", 1.0, "shelf-a", 1.0, "sku-a"))
        self.assertEqual(len(started), 1)
        self.assertEqual(started[0].kind, DwellEventKind.started)
        self.assertEqual(started[0].dwell_seconds, 1.0)

        self.assertEqual(machine.update(DwellObservation("s1", 1.1, None, 0.0)), ())
        ended = machine.tick(1.7)
        self.assertEqual(len(ended), 1)
        self.assertEqual(ended[0].kind, DwellEventKind.ended)
        self.assertEqual(ended[0].ended_at, 1.0)
        self.assertEqual(machine.tick(2.0), ())

    def test_short_glance_is_not_a_dwell(self) -> None:
        machine = DwellEventStateMachine(minimum_dwell_seconds=1.0, exit_grace_seconds=0.1)
        machine.update(DwellObservation("s1", 0.0, "shelf-a", 0.9))
        machine.update(DwellObservation("s1", 0.2, "shelf-a", 0.9))
        self.assertEqual(machine.tick(0.31), ())

    def test_out_of_order_observations_are_rejected(self) -> None:
        machine = DwellEventStateMachine()
        machine.update(DwellObservation("s1", 2.0, "shelf-a", 0.9))
        with self.assertRaises(MLConfigurationError):
            machine.update(DwellObservation("s1", 1.0, "shelf-a", 0.9))


if __name__ == "__main__":
    unittest.main()
