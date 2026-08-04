from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.zone import Zone
from app.schemas.zone import ZoneCreate, ZoneUpdate

class ZoneRepository:
    @staticmethod
    def create_zone(db: Session, zone_in: ZoneCreate) -> Zone:
        db_zone = Zone(
            store_id=zone_in.store_id,
            name=zone_in.name,
            zone_type=zone_in.zone_type,
            x=zone_in.x,
            y=zone_in.y,
            width=zone_in.width,
            height=zone_in.height
        )
        db.add(db_zone)
        db.commit()
        db.refresh(db_zone)
        return db_zone

    @staticmethod
    def get_zone(db: Session, zone_id: str) -> Optional[Zone]:
        return db.query(Zone).filter(Zone.id == zone_id).first()

    @staticmethod
    def list_zones(db: Session, skip: int = 0, limit: int = 100) -> List[Zone]:
        return db.query(Zone).offset(skip).limit(limit).all()

    @staticmethod
    def list_store_zones(db: Session, store_id: str, skip: int = 0, limit: int = 100) -> List[Zone]:
        return db.query(Zone).filter(Zone.store_id == store_id).offset(skip).limit(limit).all()

    @staticmethod
    def update_zone(db: Session, db_zone: Zone, zone_in: ZoneUpdate) -> Zone:
        update_data = zone_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_zone, field, value)
        db.commit()
        db.refresh(db_zone)
        return db_zone

    @staticmethod
    def delete_zone(db: Session, db_zone: Zone) -> None:
        db.delete(db_zone)
        db.commit()
