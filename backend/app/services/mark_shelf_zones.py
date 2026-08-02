"""
Interactive tool: click a polygon directly on a real camera frame to define
a shelf's zone_coordinates for a ShelfCameraView row.

This does NOT write to the database itself — it only prints the coordinates
you clicked as JSON, so you can review them before POSTing to
/api/shelves/{shelf_id}/camera-views (or whatever the actual endpoint is —
not yet built/confirmed, see note at bottom).

Usage:
    python -m app.services.mark_shelf_zones <path_to_video> [--frame N]

Controls:
    Left click   - add a point to the current polygon
    'n'          - finish current polygon, start a new one (prints JSON so far)
    'u'          - undo last point
    's'          - save/print all polygons collected so far as JSON, keep going
    'q' / ESC    - quit and print final JSON

Why a live frame, not a blank canvas: shelf positions only make sense
relative to what the camera actually sees (aisle angle, shelf height in
frame, etc.) — clicking on an accurate frame is the only way the resulting
box is real, everything else would be a guess dressed up as data.
"""
import argparse
import json
import sys

import cv2

points_current: list[list[int]] = []
polygons: list[list[list[int]]] = []
frame_display = None
frame_original = None


def redraw():
    global frame_display
    frame_display = frame_original.copy()

    # draw completed polygons in green
    for poly in polygons:
        pts = [tuple(p) for p in poly]
        for i in range(len(pts)):
            cv2.line(frame_display, pts[i], pts[(i + 1) % len(pts)], (0, 200, 0), 2)
        for p in pts:
            cv2.circle(frame_display, p, 4, (0, 200, 0), -1)

    # draw current in-progress polygon in yellow
    for i, p in enumerate(points_current):
        cv2.circle(frame_display, tuple(p), 4, (0, 220, 255), -1)
        if i > 0:
            cv2.line(frame_display, tuple(points_current[i - 1]), tuple(p), (0, 220, 255), 2)

    cv2.imshow("mark shelf zones", frame_display)


def on_mouse(event, x, y, flags, param):
    if event == cv2.EVENT_LBUTTONDOWN:
        points_current.append([x, y])
        redraw()


def main():
    global frame_original

    parser = argparse.ArgumentParser()
    parser.add_argument("video_path", type=str, help="Path to the camera's video file (e.g. backend/data/Zone_2.mp4)")
    parser.add_argument("--frame", type=int, default=30, help="Which frame number to grab (default 30, skips the first blank/dark frames some clips start with)")
    args = parser.parse_args()

    cap = cv2.VideoCapture(args.video_path)
    if not cap.isOpened():
        print(f"Could not open video: {args.video_path}")
        sys.exit(1)

    cap.set(cv2.CAP_PROP_POS_FRAMES, args.frame)
    ok, frame = cap.read()
    cap.release()
    if not ok:
        print(f"Could not read frame {args.frame} from {args.video_path} — try a lower --frame value.")
        sys.exit(1)

    frame_original = frame
    cv2.namedWindow("mark shelf zones")
    cv2.setMouseCallback("mark shelf zones", on_mouse)
    redraw()

    print("Click points to outline a shelf's boundary on the frame.")
    print("Press 'n' when a shelf's polygon is done to start the next one.")
    print("Press 'u' to undo the last point, 's' to print progress, 'q'/ESC to finish.")

    while True:
        key = cv2.waitKey(20) & 0xFF

        if key == ord("n"):
            if len(points_current) >= 3:
                polygons.append(points_current.copy())
                print(f"Polygon {len(polygons)} saved: {points_current}")
                points_current.clear()
                redraw()
            else:
                print("Need at least 3 points to close a polygon.")

        elif key == ord("u"):
            if points_current:
                points_current.pop()
                redraw()

        elif key == ord("s"):
            print(json.dumps(polygons, indent=2))

        elif key in (ord("q"), 27):
            if len(points_current) >= 3:
                polygons.append(points_current.copy())
            break

    cv2.destroyAllWindows()

    print("\nFinal zone_coordinates JSON (one array per shelf polygon, in click order):")
    print(json.dumps(polygons, indent=2))
    print(
        "\nNOTE: this script only outputs the coordinates — it does not know which "
        "polygon belongs to which shelf_id/camera_id, and does not POST anything. "
        "Match each polygon to a shelf yourself and submit it via the API. "
        "Also: the actual endpoint for creating a ShelfCameraView row hasn't been "
        "confirmed to exist yet — check /docs for a POST route under shelves or "
        "cameras before assuming one is there."
    )


if __name__ == "__main__":
    main()
