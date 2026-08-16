"""
Run with: pytest test_intake.py -v
Uses the public OpenCV sample video (samples/data/vtest.avi, 10fps/795 frames)
as fixture data -- download it once with:
  curl -sL -o sample_data/vtest.avi \
    https://raw.githubusercontent.com/opencv/opencv/master/samples/data/vtest.avi
"""
import os

import cv2
import pytest

from intake import IntakeConfig, VideoIntake

SAMPLE_VIDEO = os.path.join(os.path.dirname(__file__), "sample_data", "vtest.avi")


@pytest.mark.skipif(not os.path.exists(SAMPLE_VIDEO), reason="sample video not downloaded")
def test_downsamples_to_target_fps(tmp_path):
    output_path = str(tmp_path / "out.mp4")
    config = IntakeConfig(source=SAMPLE_VIDEO, target_fps=5.0, output_path=output_path)
    intake = VideoIntake(config)

    emitted = intake.run()

    cap = cv2.VideoCapture(SAMPLE_VIDEO)
    native_fps = cap.get(cv2.CAP_PROP_FPS)
    native_frame_count = cap.get(cv2.CAP_PROP_FRAME_COUNT)
    cap.release()

    expected_ratio = native_fps / 5.0
    expected_emitted = int(native_frame_count / expected_ratio)

    # allow +/- 1 frame for rounding at the tail of the file
    assert abs(emitted - expected_emitted) <= 1

    out_cap = cv2.VideoCapture(output_path)
    assert out_cap.get(cv2.CAP_PROP_FPS) == 5.0
    out_cap.release()


@pytest.mark.skipif(not os.path.exists(SAMPLE_VIDEO), reason="sample video not downloaded")
def test_resize_reduces_frame_width(tmp_path):
    output_path = str(tmp_path / "out_small.mp4")
    config = IntakeConfig(
        source=SAMPLE_VIDEO, target_fps=5.0, resize_width=320, output_path=output_path
    )
    VideoIntake(config).run()

    out_cap = cv2.VideoCapture(output_path)
    assert out_cap.get(cv2.CAP_PROP_FRAME_WIDTH) == 320.0
    out_cap.release()


def test_on_frame_callback_receives_expected_frame_count(tmp_path):
    if not os.path.exists(SAMPLE_VIDEO):
        pytest.skip("sample video not downloaded")

    seen = []
    config = IntakeConfig(source=SAMPLE_VIDEO, target_fps=5.0)
    VideoIntake(config).run(on_frame=lambda frame, idx, ts: seen.append(idx))

    assert len(seen) > 0
    assert seen == list(range(len(seen)))  # sequential, no gaps
