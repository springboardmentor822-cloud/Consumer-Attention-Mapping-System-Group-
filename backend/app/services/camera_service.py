from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.models.camera import Camera
from backend.app.models.store import Store
from backend.app.schemas.camera import CameraCreate, CameraUpdate


class CameraService:
    def list_cameras(self, db: Session) -> list[Camera]:
        return list(db.scalars(select(Camera).order_by(Camera.id)).all())

    def get_camera(self, db: Session, camera_id: UUID) -> Camera:
        camera = db.get(Camera, camera_id)
        if camera is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Camera not found")
        return camera

    def create_camera(self, db: Session, payload: CameraCreate) -> Camera:
        store = db.get(Store, payload.store_id)
        if store is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Store not found")

        camera = Camera(
            store_id=payload.store_id,
            camera_name=payload.camera_name,
            camera_source=payload.camera_source,
            status=payload.status,
        )
        db.add(camera)
        db.commit()
        db.refresh(camera)
        return camera

    def update_camera(self, db: Session, camera_id: UUID, payload: CameraUpdate) -> Camera:
        camera = self.get_camera(db, camera_id)
        update_data = payload.model_dump(exclude_unset=True)
        if "store_id" in update_data:
            store = db.get(Store, update_data["store_id"])
            if store is None:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Store not found")
            camera.store_id = update_data["store_id"]
        if "camera_name" in update_data:
            camera.camera_name = update_data["camera_name"]
        if "camera_source" in update_data:
            camera.camera_source = update_data["camera_source"]
        if "status" in update_data:
            camera.status = update_data["status"]
        db.commit()
        db.refresh(camera)
        return camera

    def delete_camera(self, db: Session, camera_id: UUID) -> None:
        camera = self.get_camera(db, camera_id)
        db.delete(camera)
        db.commit()


camera_service = CameraService()
