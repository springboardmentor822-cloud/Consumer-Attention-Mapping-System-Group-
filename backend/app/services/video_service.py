"""
Service layer for Part 7 (video upload) and Part 8 (AI processing API).
Keeps file-system and pipeline-orchestration logic out of the routers.
"""

from __future__ import annotations

from pathlib import Path

from fastapi import HTTPException, UploadFile, status

from app.ai.inference import process_video
from app.ai.video_processor import SUPPORTED_VIDEO_EXTENSIONS

BACKEND_ROOT = Path(__file__).resolve().parents[2]
UPLOAD_DIR = BACKEND_ROOT / "uploads" / "videos"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


class VideoService:
    @staticmethod
    async def save_upload(file: UploadFile) -> dict:
        suffix = Path(file.filename or "").suffix.lower()
        if suffix not in SUPPORTED_VIDEO_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file type '{suffix}'. Allowed: {sorted(SUPPORTED_VIDEO_EXTENSIONS)}",
            )

        destination = UPLOAD_DIR / file.filename
        contents = await file.read()
        destination.write_bytes(contents)

        return {
            "filename": file.filename,
            "stored_path": str(destination),
            "size_bytes": len(contents),
            "content_type": file.content_type,
        }

    @staticmethod
    def resolve_path(filename: str) -> Path:
        path = UPLOAD_DIR / filename
        if not path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Video '{filename}' not found in uploads/videos/. Upload it first via /api/video/upload.",
            )
        return path

    @staticmethod
    def run_pipeline(
        filename: str,
        camera_id: int,
        zone_id: int | None,
        frame_skip: int,
        max_frames: int | None,
    ) -> dict:
        video_path = VideoService.resolve_path(filename)
        return process_video(
            video_path=video_path,
            camera_id=camera_id,
            zone_id=zone_id,
            frame_skip=frame_skip,
            max_frames=max_frames,
        )
