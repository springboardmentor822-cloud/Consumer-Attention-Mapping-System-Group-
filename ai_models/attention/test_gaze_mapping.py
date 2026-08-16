import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from ai_models.attention.gaze_mapping import (
    ShelfTarget,
    SustainedAttentionTracker,
    estimate_gaze_target,
    yaw_to_facing_angle,
)


def test_yaw_to_facing_angle_combines_correctly():
    assert yaw_to_facing_angle(head_yaw_degrees=10, camera_mount_angle_degrees=90) == 100
    assert yaw_to_facing_angle(head_yaw_degrees=-10, camera_mount_angle_degrees=0) == 350  # wraps


def test_picks_shelf_directly_ahead():
    shelves = [
        ShelfTarget(shelf_id=1, floor_x=5.0, floor_y=0.0),  # due east
        ShelfTarget(shelf_id=2, floor_x=0.0, floor_y=5.0),  # due north
    ]
    # facing due east (0 degrees) should match shelf 1, not shelf 2
    result = estimate_gaze_target(0.0, 0.0, facing_angle_degrees=0.0, candidate_shelves=shelves)
    assert result is not None
    assert result.shelf_id == 1


def test_no_target_when_facing_away_from_everything():
    shelves = [ShelfTarget(shelf_id=1, floor_x=5.0, floor_y=0.0)]
    # facing due west, shelf is due east -> nothing in range
    result = estimate_gaze_target(0.0, 0.0, facing_angle_degrees=180.0, candidate_shelves=shelves)
    assert result is None


def test_no_target_when_shelf_too_far():
    shelves = [ShelfTarget(shelf_id=1, floor_x=50.0, floor_y=0.0)]
    result = estimate_gaze_target(
        0.0, 0.0, facing_angle_degrees=0.0, candidate_shelves=shelves, max_distance_m=6.0
    )
    assert result is None


def test_prefers_closer_angular_match_over_distance():
    shelves = [
        ShelfTarget(shelf_id=1, floor_x=3.0, floor_y=0.3),  # slightly off, close
        ShelfTarget(shelf_id=2, floor_x=3.0, floor_y=0.0),  # dead-on, same distance-ish
    ]
    result = estimate_gaze_target(0.0, 0.0, facing_angle_degrees=0.0, candidate_shelves=shelves)
    assert result.shelf_id == 2


def test_sustained_attention_requires_minimum_duration():
    tracker = SustainedAttentionTracker(min_duration_seconds=2.0, gap_tolerance_seconds=1.0)
    gaze = estimate_gaze_target(
        0, 0, 0.0, [ShelfTarget(shelf_id=1, floor_x=3, floor_y=0)]
    )

    # only 0.5s of gaze -> too short, then gaze lost
    assert tracker.update("session-1", 0.0, gaze) is None
    result = tracker.update("session-1", 0.5, None)  # gaze lost immediately -> not enough gap yet
    assert result is None  # gap tolerance not exceeded yet, still pending
    result = tracker.update("session-1", 2.0, None)  # now gap exceeded -> finalize
    assert result is None  # duration (0.5s) was under min_duration_seconds, so nothing emitted


def test_sustained_attention_emits_after_threshold():
    tracker = SustainedAttentionTracker(min_duration_seconds=2.0, gap_tolerance_seconds=1.0)
    gaze = estimate_gaze_target(0, 0, 0.0, [ShelfTarget(shelf_id=1, floor_x=3, floor_y=0)])

    tracker.update("session-1", 0.0, gaze)
    tracker.update("session-1", 1.0, gaze)
    tracker.update("session-1", 2.5, gaze)  # 2.5s of continuous gaze so far
    emitted = tracker.update("session-1", 4.0, None)  # gaze lost, gap > tolerance -> finalize
    assert emitted is not None
    assert emitted.shelf_id == 1
    assert emitted.duration_seconds == 2.5
    assert emitted.is_repeat is False


def test_repeat_attention_is_flagged_on_second_visit():
    tracker = SustainedAttentionTracker(min_duration_seconds=1.0, gap_tolerance_seconds=0.5)
    shelf = ShelfTarget(shelf_id=1, floor_x=3, floor_y=0)
    gaze = estimate_gaze_target(0, 0, 0.0, [shelf])

    tracker.update("session-1", 0.0, gaze)
    tracker.update("session-1", 1.5, gaze)
    tracker.update("session-1", 2.5, None)  # gap exceeded -> first visit finalized, not repeat

    tracker.update("session-1", 5.0, gaze)  # look back at the same shelf
    tracker.update("session-1", 6.5, gaze)
    emitted = tracker.flush("session-1")

    assert emitted is not None
    assert emitted.is_repeat is True


def test_flush_finalizes_active_attention_on_session_end():
    tracker = SustainedAttentionTracker(min_duration_seconds=1.0)
    gaze = estimate_gaze_target(0, 0, 0.0, [ShelfTarget(shelf_id=7, floor_x=3, floor_y=0)])

    tracker.update("session-1", 0.0, gaze)
    tracker.update("session-1", 3.0, gaze)
    emitted = tracker.flush("session-1")

    assert emitted is not None
    assert emitted.shelf_id == 7
    assert emitted.duration_seconds == 3.0
