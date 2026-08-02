"""
Detection-accuracy validation of PersonDetector against MOT17-04 ground truth.

Scope, stated plainly: this validates whether the detector finds real
people (precision/recall via IoU matching) — it does NOT validate ID
consistency through occlusion, since this dataset's label conversion
dropped the track_id column. That part of Step 3/4 remains unverified
by any automated metric; check it qualitatively by watching tracked
output video for visible ID swaps instead.
"""

from pathlib import Path

import numpy as np
from ultralytics import YOLO

from app.services.frame_pipeline import DEVICE, get_mot17_validation_source

IOU_MATCH_THRESHOLD = 0.5
CONF_THRESHOLD = 0.25
COCO_PERSON_CLASS = 0


def load_gt_boxes_xyxy(label_path: Path, img_w: int, img_h: int) -> np.ndarray:
    """MOT17's YOLO-format labels: class x_center y_center w h, normalized.
    Converts to absolute xyxy pixel coords for IoU matching."""
    if not label_path.exists():
        return np.zeros((0, 4))
    rows = []
    for line in label_path.read_text().strip().splitlines():
        parts = line.split()
        if len(parts) != 5:
            continue  # malformed line, skip rather than crash the whole run
        _, xc, yc, w, h = map(float, parts)
        x1 = (xc - w / 2) * img_w
        y1 = (yc - h / 2) * img_h
        x2 = (xc + w / 2) * img_w
        y2 = (yc + h / 2) * img_h
        rows.append([x1, y1, x2, y2])
    return np.array(rows) if rows else np.zeros((0, 4))


def iou_matrix(boxes_a: np.ndarray, boxes_b: np.ndarray) -> np.ndarray:
    if len(boxes_a) == 0 or len(boxes_b) == 0:
        return np.zeros((len(boxes_a), len(boxes_b)))
    ax1, ay1, ax2, ay2 = boxes_a[:, 0:1], boxes_a[:, 1:2], boxes_a[:, 2:3], boxes_a[:, 3:4]
    bx1, by1, bx2, by2 = boxes_b[:, 0], boxes_b[:, 1], boxes_b[:, 2], boxes_b[:, 3]

    inter_x1 = np.maximum(ax1, bx1)
    inter_y1 = np.maximum(ay1, by1)
    inter_x2 = np.minimum(ax2, bx2)
    inter_y2 = np.minimum(ay2, by2)
    inter_area = np.maximum(0, inter_x2 - inter_x1) * np.maximum(0, inter_y2 - inter_y1)

    area_a = (ax2 - ax1) * (ay2 - ay1)
    area_b = (bx2 - bx1) * (by2 - by1)
    union = area_a + area_b.reshape(1, -1) - inter_area
    return inter_area / np.maximum(union, 1e-6)


def greedy_match(pred_boxes: np.ndarray, gt_boxes: np.ndarray) -> tuple[int, int, int]:
    """Returns (true_positives, false_positives, false_negatives) for one frame."""
    if len(gt_boxes) == 0:
        return 0, len(pred_boxes), 0
    if len(pred_boxes) == 0:
        return 0, 0, len(gt_boxes)

    ious = iou_matrix(pred_boxes, gt_boxes)
    matched_gt = set()
    tp = 0
    for pred_idx in range(len(pred_boxes)):
        best_gt = np.argmax(ious[pred_idx])
        if ious[pred_idx, best_gt] >= IOU_MATCH_THRESHOLD and best_gt not in matched_gt:
            matched_gt.add(int(best_gt))
            tp += 1
    fp = len(pred_boxes) - tp
    fn = len(gt_boxes) - len(matched_gt)
    return tp, fp, fn


def run_validation():
    model = YOLO("yolov8s.pt")
    model.to(DEVICE)

    source = get_mot17_validation_source()
    labels_dir = (
        source.paths[0].parent.parent / "labels"
        if source.paths
        else None
    )

    total_tp = total_fp = total_fn = 0

    for frame in source:
        img_h, img_w = frame.image_bgr.shape[:2]
        label_path = labels_dir / (
            Path(source.paths[frame.index]).stem + ".txt"
        )
        gt_boxes = load_gt_boxes_xyxy(label_path, img_w, img_h)

        results = model.predict(
            frame.image_bgr,
            classes=[COCO_PERSON_CLASS],
            conf=CONF_THRESHOLD,
            device=DEVICE,
            verbose=False,
        )
        pred_boxes = results[0].boxes.xyxy.cpu().numpy()

        tp, fp, fn = greedy_match(pred_boxes, gt_boxes)
        total_tp += tp
        total_fp += fp
        total_fn += fn

        if frame.index % 100 == 0:
            print(f"frame {frame.index}/{len(source)}: running TP={total_tp} FP={total_fp} FN={total_fn}")

    precision = total_tp / max(total_tp + total_fp, 1)
    recall = total_tp / max(total_tp + total_fn, 1)
    f1 = 2 * precision * recall / max(precision + recall, 1e-6)

    print("\n--- MOT17-04 detection validation (IoU >= 0.5) ---")
    print(f"TP={total_tp} FP={total_fp} FN={total_fn}")
    print(f"Precision={precision:.3f} Recall={recall:.3f} F1={f1:.3f}")


if __name__ == "__main__":
    run_validation()