import datetime as dt

from sqlalchemy import Column, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.enums import (
    HeatmapTypeEnum,
    NotificationSeverityEnum,
    NotificationTypeEnum,
    RecommendationTypeEnum,
    ReportFormatEnum,
    ReportTypeEnum,
)


class Heatmap(Base):
    __tablename__ = "heatmaps"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    camera_id = Column(Integer, ForeignKey("cameras.id"), nullable=True)
    heatmap_type = Column(Enum(HeatmapTypeEnum), nullable=False)

    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)

    # serialized grid/matrix data, JSON-encoded (e.g. list of [x, y, intensity])
    data = Column(Text, nullable=False)

    generated_at = Column(DateTime, default=dt.datetime.utcnow)

    store = relationship("Store")


class ProductAttractivenessScore(Base):
    __tablename__ = "product_attractiveness_scores"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)

    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)

    attention_duration_score = Column(Float, default=0.0)      # 35%
    interaction_frequency_score = Column(Float, default=0.0)   # 25%
    pickup_rate_score = Column(Float, default=0.0)             # 20%
    conversion_rate_score = Column(Float, default=0.0)         # 15%
    repeat_engagement_score = Column(Float, default=0.0)       # 5%

    total_score = Column(Float, default=0.0)  # weighted composite, 0-100

    computed_at = Column(DateTime, default=dt.datetime.utcnow)

    product = relationship("Product", back_populates="attractiveness_scores")


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    requested_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    report_type = Column(Enum(ReportTypeEnum), nullable=False)
    report_format = Column(Enum(ReportFormatEnum), nullable=False)

    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)

    file_path = Column(String(500), nullable=True)
    status = Column(String(50), default="pending")  # pending, generating, ready, failed

    created_at = Column(DateTime, default=dt.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    store = relationship("Store")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=True)
    camera_id = Column(Integer, ForeignKey("cameras.id"), nullable=True)
    shelf_id = Column(Integer, ForeignKey("shelves.id"), nullable=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)

    notification_type = Column(Enum(NotificationTypeEnum), nullable=False)
    severity = Column(Enum(NotificationSeverityEnum), default=NotificationSeverityEnum.INFO)
    message = Column(Text, nullable=False)

    is_read = Column(Integer, default=0)
    created_at = Column(DateTime, default=dt.datetime.utcnow)


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    shelf_id = Column(Integer, ForeignKey("shelves.id"), nullable=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)

    recommendation_type = Column(Enum(RecommendationTypeEnum), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    confidence_score = Column(Float, nullable=True)  # 0-1

    is_dismissed = Column(Integer, default=0)
    created_at = Column(DateTime, default=dt.datetime.utcnow)
