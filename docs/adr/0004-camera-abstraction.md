# ADR 0004: Camera Source Interface Abstraction

## Status
Proposed & Approved

## Context
Retail locations deploy different camera setups: some use legacy RTSP streams, others use files, and web sandboxes use virtual webcams. Coupling the ingestion loop directly to OpenCV's `VideoCapture` limits flexibility and blocks unit testing of frame analyzers.

## Decision
We introduce an abstract **CameraSource** interface:
1. **Abstraction**: A base `CameraSource` class defines `read_frame()`, `release()`, and `is_opened()` methods.
2. **Implementations**:
   - `RTSPCamera`: Connects to live network RTSP feeds.
   - `VideoFileCamera`: Reads simulated local `.mp4` video files.
   - `WebcamCamera`: Connects to system webcam devices.
3. **Registry**: A camera factory returns the appropriate instance based on the registered camera URL.

## Consequences
- **Pros**: Easy testing using mock file streams; decoupled surveillance stream code; smooth switching between webcam demos and production environments.
- **Cons**: Minor overhead wrapping OpenCV frame calls in interface adapters.
