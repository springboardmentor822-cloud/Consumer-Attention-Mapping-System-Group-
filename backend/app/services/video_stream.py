"""
Video stream ingestion for the Consumer Attention Mapping System.

Follows the pattern recommended in Milestone 1's doc under
"OpenCV Video Ingestion Patterns" (opencv-video-stream-templates):
a threaded VideoStream reader, so frame grabbing (I/O-bound, blocks on
cap.read()) doesn't stall whatever is consuming/processing frames.

This also mirrors the shape of Milestone 2's decoupled ingestion
architecture (Redis Streams: a fast producer thread pushes into a
queue, a separate consumer drains it) - just single-process here.
"""

import queue
import threading
import time

import cv2


class VideoStream:
    """
    Reads frames from a video source (file path, RTSP URL, or webcam index)
    on a dedicated background thread and pushes them into a bounded queue.
    The main thread (or any consumer) pulls frames from the queue without
    ever blocking on the camera/file I/O itself.

    Usage:
        stream = VideoStream(source="sample.mp4").start()
        for frame_count, timestamp, frame in stream.frames():
            ...  # process frame
        stream.stop()
    """

    def __init__(
        self,
        source,
        resize_to: tuple[int, int] = (640, 480),
        queue_size: int = 128,
    ):
        self.source = source
        self.resize_to = resize_to
        self.queue: "queue.Queue" = queue.Queue(maxsize=queue_size)

        self._cap = None
        self._thread = None
        self._stopped = threading.Event()

        self.frame_count = 0
        self.dropped_frames = 0
        self._start_time = None

    def start(self) -> "VideoStream":
        self._cap = cv2.VideoCapture(self.source)
        if not self._cap.isOpened():
            raise RuntimeError(f"Could not open video source: {self.source}")

        self._start_time = time.time()
        self._thread = threading.Thread(target=self._reader_loop, daemon=True)
        self._thread.start()
        return self

    def _reader_loop(self):
        """Runs on the background thread. Only reads/resizes/queues - no processing here."""
        while not self._stopped.is_set():
            ret, frame = self._cap.read()
            if not ret:
                print(f"[stream] Source ended or read failed at frame {self.frame_count}")
                break

            frame = cv2.resize(frame, self.resize_to)
            self.frame_count += 1
            elapsed = time.time() - self._start_time

            try:
                # non-blocking put: if the consumer is slower than the source,
                # drop the oldest frame rather than growing memory unbounded
                # (this is the "no memory leaks under load" requirement from the doc)
                self.queue.put_nowait((self.frame_count, elapsed, frame))
            except queue.Full:
                try:
                    self.queue.get_nowait()  # discard oldest
                    self.dropped_frames += 1
                except queue.Empty:
                    pass
                self.queue.put_nowait((self.frame_count, elapsed, frame))

            print(f"[stream] frame={self.frame_count} timestamp={elapsed:.2f}s shape={frame.shape}")

        self.stop()

    def frames(self):
        """Consumer-side generator: yields (frame_count, timestamp, frame) tuples."""
        while not self._stopped.is_set() or not self.queue.empty():
            try:
                yield self.queue.get(timeout=1.0)
            except queue.Empty:
                if self._stopped.is_set():
                    break

    def stop(self):
        if self._stopped.is_set():
            return
        self._stopped.set()
        if self._cap is not None:
            self._cap.release()
            print(
                f"[stream] Released capture. "
                f"Total frames processed: {self.frame_count}, dropped: {self.dropped_frames}"
            )


def process_video_stream(source, resize_to: tuple[int, int] = (640, 480), max_frames: int | None = None):
    """
    Simple pure-function wrapper for one-off verification runs
    (kept for callers that just want a quick synchronous generator
    without managing a VideoStream instance's lifecycle themselves).
    """
    stream = VideoStream(source, resize_to=resize_to).start()
    try:
        count = 0
        for frame_count, elapsed, frame in stream.frames():
            yield frame_count, elapsed, frame
            count += 1
            if max_frames is not None and count >= max_frames:
                print(f"[stream] Reached max_frames={max_frames}, stopping.")
                break
    finally:
        stream.stop()


if __name__ == "__main__":
    # Local verification run:
    #   python -m app.services.video_stream <path_to_video_or_0_for_webcam> [--show]
    # --show opens a visible window playing the frames live (for recording a demo),
    # in addition to the console frame-metadata logs. Press 'q' to quit early.
    import sys

    args = sys.argv[1:]
    show_window = "--show" in args
    args = [a for a in args if a != "--show"]

    source_arg = args[0] if args else 0
    if isinstance(source_arg, str) and source_arg.isdigit():
        source_arg = int(source_arg)

    for frame_count, elapsed, frame in process_video_stream(source_arg, max_frames=200):
        if show_window:
            overlay = frame.copy()
            cv2.putText(
                overlay,
                f"Frame {frame_count}  t={elapsed:.2f}s",
                (10, 25),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (0, 255, 0),
                2,
            )
            cv2.imshow("Consumer Attention Mapping - Stream Verification", overlay)
            if cv2.waitKey(1) & 0xFF == ord("q"):
                print("[stream] 'q' pressed, stopping early.")
                break

    if show_window:
        cv2.destroyAllWindows()
