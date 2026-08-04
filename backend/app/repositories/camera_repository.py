from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.camera import Camera
from app.schemas.camera import CameraCreate, CameraUpdate

class CameraRepository:
    @staticmethod
    def create_camera(db: Session, camera_in: CameraCreate) -> Camera:
        db_camera = Camera(
            store_id=camera_in.store_id,
            name=camera_in.name,
            stream_url=camera_in.stream_url,
            location_name=camera_in.location_name,
            x=camera_in.x,
            y=camera_in.y,
            rotation_angle=camera_in.rotation_angle if camera_in.rotation_angle is not None else 0.0,
            is_active=camera_in.is_active if camera_in.is_active is not None else True
        )
        db.add(db_camera)
        db.commit()
        db.refresh(db_camera)
        return db_camera

    @staticmethod
    def get_camera(db: Session, camera_id: str) -> Optional[Camera]:
        return db.query(Camera).filter(Camera.id == camera_id).first()

    @staticmethod
    def get_camera_by_name_in_store(db: Session, name: str, store_id: str) -> Optional[Camera]:
        return db.query(Camera).filter(Camera.name == name, Camera.store_id == store_id).first()

    @staticmethod
    def list_cameras(db: Session, skip: int = 0, limit: int = 100) -> List[Camera]:
        return db.query(Camera).offset(skip).limit(limit).all()

    @staticmethod
    def list_store_cameras(db: Session, store_id: str, skip: int = 0, limit: int = 100) -> List[Camera]:
        return db.query(Camera).filter(Camera.store_id == store_id).offset(skip).limit(limit).all()

    @staticmethod
    def update_camera(db: Session, db_camera: Camera, camera_in: CameraUpdate) -> Camera:
        update_data = camera_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_camera, field, value)
        db.commit()
        db.refresh(db_camera)
        return db_camera

    @staticmethod
    def delete_camera(db: Session, db_camera: Camera) -> None:
        db.delete(db_camera)
        db.commit()
