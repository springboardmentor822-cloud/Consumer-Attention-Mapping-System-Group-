from datetime import datetime

from pydantic import BaseModel


class SystemHealthResponse(BaseModel):
    cpu_percent: float
    memory_percent: float
    memory_used_mb: float
    memory_total_mb: float
    disk_percent: float
    disk_used_gb: float
    disk_total_gb: float
    process_count: int
    uptime_seconds: float
    api_status: str
    db_status: str


class AuditLogItem(BaseModel):
    id: int
    timestamp: datetime
    actor_email: str | None
    actor_role: str | None
    action: str
    resource: str | None
    resource_id: int | None
    severity: str
    message: str

    class Config:
        from_attributes = True


class AuditLogsResponse(BaseModel):
    logs: list[AuditLogItem]
    total: int
