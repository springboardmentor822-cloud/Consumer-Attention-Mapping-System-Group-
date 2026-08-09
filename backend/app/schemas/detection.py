from datetime import datetime
from pydantic import BaseModel

class DetectionResponse(BaseModel):
    id: int
    camera_id: int
    timestamp: datetime
    people_count: int
    attention_score: float

    model_config = {"from_attributes": True}