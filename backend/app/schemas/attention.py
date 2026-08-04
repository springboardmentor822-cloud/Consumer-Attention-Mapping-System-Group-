from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class AttentionBase(BaseModel):
    session_id: str
    camera_id: str
    zone_id: str
    attention_score: float = Field(..., ge=0.0, le=1.0)
    gaze_duration_ms: float = Field(..., ge=0.0)
    confidence: float = Field(1.0, ge=0.0, le=1.0)
    timestamp: Optional[datetime] = None

class AttentionCreate(AttentionBase):
    pass

class AttentionUpdate(BaseModel):
    session_id: Optional[str] = None
    camera_id: Optional[str] = None
    zone_id: Optional[str] = None
    attention_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    gaze_duration_ms: Optional[float] = Field(None, ge=0.0)
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0)
    timestamp: Optional[datetime] = None

class AttentionResponse(AttentionBase):
    id: str
    timestamp: datetime
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
