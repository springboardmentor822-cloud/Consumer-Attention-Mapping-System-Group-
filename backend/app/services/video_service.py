from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

import cv2


@dataclass(slots=True)
class VideoService:
    output_width: int = 960
    output_height: int = 540

    def _resolve_source(self, source: int | str) -> int | str:
        if isinstance(source, str) and source.isdigit():
            return int(source)
        return source

    def verify_stream(self, source: int | str = 0) -> None:
        capture = cv2.VideoCapture(self._resolve_source(source))
        if not capture.isOpened():
            raise RuntimeError("Unable to open the provided video source")

        frame_count = 0
        start_time = datetime.now()

        try:
            while True:
                success, frame = capture.read()
                if not success:
                    break

                frame_count += 1
                resized_frame = cv2.resize(frame, (self.output_width, self.output_height))
                elapsed_seconds = max((datetime.now() - start_time).total_seconds(), 0.0001)
                fps = frame_count / elapsed_seconds
                timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

                cv2.putText(resized_frame, f"Frame: {frame_count}", (20, 35), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
                cv2.putText(resized_frame, f"FPS: {fps:.2f}", (20, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
                cv2.putText(resized_frame, f"Timestamp: {timestamp}", (20, 105), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)

                cv2.imshow("Consumer Attention Mapping System - Stream Verification", resized_frame)
                if cv2.waitKey(1) & 0xFF == ord("q"):
                    break
        finally:
            capture.release()
            cv2.destroyAllWindows()


video_service = VideoService()
