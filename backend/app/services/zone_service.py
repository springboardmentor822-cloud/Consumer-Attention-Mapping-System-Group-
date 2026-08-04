from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List
from app.models.zone import Zone
from app.repositories.zone_repository import ZoneRepository
from app.repositories.store_repository import StoreRepository
from app.schemas.zone import ZoneCreate, ZoneUpdate, VALID_ZONE_TYPES
from app.utils.geometry import is_within_bounds

class ZoneService:
    @staticmethod
    def create_zone(db: Session, zone_in: ZoneCreate) -> Zone:
        store = StoreRepository.get_store(db, zone_in.store_id)
        if not store:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Store with ID '{zone_in.store_id}' not found."
            )

        if not is_within_bounds(zone_in.x, zone_in.y, zone_in.width, zone_in.height, store.width, store.height):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Zone does not fit within the store dimensions or coordinates are negative."
            )

        if zone_in.zone_type.lower() not in VALID_ZONE_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid zone type. Must be one of {list(VALID_ZONE_TYPES)}"
            )

        return ZoneRepository.create_zone(db, zone_in)

    @staticmethod
    def get_zone(db: Session, zone_id: str) -> Zone:
        zone = ZoneRepository.get_zone(db, zone_id)
        if not zone:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Zone not found."
            )
        return zone

    @staticmethod
    def list_zones(db: Session, skip: int = 0, limit: int = 100) -> List[Zone]:
        return ZoneRepository.list_zones(db, skip, limit)

    @staticmethod
    def list_store_zones(db: Session, store_id: str, skip: int = 0, limit: int = 100) -> List[Zone]:
        store = StoreRepository.get_store(db, store_id)
        if not store:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Store with ID '{store_id}' not found."
            )
        return ZoneRepository.list_store_zones(db, store_id, skip, limit)

    @staticmethod
    def update_zone(db: Session, zone_id: str, zone_in: ZoneUpdate) -> Zone:
        db_zone = ZoneService.get_zone(db, zone_id)
        store = StoreRepository.get_store(db, db_zone.store_id)

        new_x = zone_in.x if zone_in.x is not None else db_zone.x
        new_y = zone_in.y if zone_in.y is not None else db_zone.y
        new_w = zone_in.width if zone_in.width is not None else db_zone.width
        new_h = zone_in.height if zone_in.height is not None else db_zone.height

        if not is_within_bounds(new_x, new_y, new_w, new_h, store.width, store.height):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Updated zone parameters do not fit within the store dimensions."
            )

        if zone_in.zone_type is not None and zone_in.zone_type.lower() not in VALID_ZONE_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid zone type. Must be one of {list(VALID_ZONE_TYPES)}"
            )

        return ZoneRepository.update_zone(db, db_zone, zone_in)

    @staticmethod
    def delete_zone(db: Session, zone_id: str) -> None:
        db_zone = ZoneService.get_zone(db, zone_id)
        ZoneRepository.delete_zone(db, db_zone)
