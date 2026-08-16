import datetime as dt

from sqlalchemy import Column, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.enums import ShelfLevelEnum


class ShelfCategory(Base):
    __tablename__ = "shelf_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False, unique=True)
    description = Column(Text, nullable=True)

    shelves = relationship("Shelf", back_populates="category")


class Shelf(Base):
    __tablename__ = "shelves"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    camera_id = Column(Integer, ForeignKey("cameras.id"), nullable=True)
    category_id = Column(Integer, ForeignKey("shelf_categories.id"), nullable=True)

    name = Column(String(150), nullable=False)
    aisle = Column(String(50), nullable=True)

    # bounding region in floor-plan coordinates, JSON-encoded polygon
    position_coordinates = Column(Text, nullable=True)
    # bounding box within the camera frame (pixel space), JSON-encoded
    frame_bounding_box = Column(Text, nullable=True)

    shelf_width_m = Column(Float, nullable=True)
    shelf_height_m = Column(Float, nullable=True)
    # Vertical placement (bottom/middle/eye_level/top) - drives the
    # eye-level-optimization recommendation rule. Defaults to middle since
    # that's the most common real-world placement absent other info.
    #
    # values_callable + native_enum=False: ShelfLevelEnum mixes in `str`
    # (class ShelfLevelEnum(str, enum.Enum)), and SQLAlchemy's default Enum
    # handling for that combination writes the member's *value*
    # ("middle") but reads back by matching the member's *name* ("MIDDLE")
    # - so any row ever written becomes unreadable ("'middle' is not
    # among the defined enum values ... BOTTOM, MIDDLE, ..."). Forcing
    # values_callable makes read and write both use .value consistently,
    # and native_enum=False stores it as plain VARCHAR instead of a
    # Postgres-native ENUM type so there's no separate DB-side label set
    # to fall out of sync with the Python side.
    shelf_level = Column(
        Enum(ShelfLevelEnum, values_callable=lambda enum_cls: [e.value for e in enum_cls], native_enum=False),
        nullable=False,
        default=ShelfLevelEnum.MIDDLE,
    )

    created_at = Column(DateTime, default=dt.datetime.utcnow)
    updated_at = Column(DateTime, default=dt.datetime.utcnow, onupdate=dt.datetime.utcnow)

    store = relationship("Store", back_populates="shelves")
    camera = relationship("Camera", back_populates="shelves")
    category = relationship("ShelfCategory", back_populates="shelves")
    products = relationship("Product", back_populates="shelf")
