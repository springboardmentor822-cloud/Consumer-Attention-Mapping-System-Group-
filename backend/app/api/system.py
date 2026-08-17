from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security import require_roles
from backend.app.models.user import User
from backend.app.models.store import Store
from backend.app.models.camera import Camera
from backend.app.models.alert import Alert

router = APIRouter(prefix="/system", tags=["System"])


@router.get("/health")
def system_health():
    """Public health check endpoint."""
    return {"status": "healthy", "service": "consumer-attention-mapping-system"}


@router.get("/stats")
def system_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Administrator")),
):
    """System-wide statistics for admin dashboard."""
    total_users = db.query(func.count(User.id)).scalar() or 0
    active_users = db.query(func.count(User.id)).filter(User.is_active == True).scalar() or 0
    total_stores = db.query(func.count(Store.id)).scalar() or 0
    total_cameras = db.query(func.count(Camera.id)).scalar() or 0
    cameras_online = db.query(func.count(Camera.id)).filter(Camera.status == "active").scalar() or 0
    cameras_offline = total_cameras - cameras_online
    open_alerts = db.query(func.count(Alert.id)).filter(Alert.status == "open").scalar() or 0

    # Users by role
    from backend.app.models.role import Role
    role_counts = db.query(Role.role_name, func.count(User.id)).join(
        User, User.role_id == Role.id
    ).group_by(Role.role_name).all()

    users_by_role = {name: count for name, count in role_counts}

    return {
        "total_users": total_users,
        "active_users": active_users,
        "total_stores": total_stores,
        "total_cameras": total_cameras,
        "cameras_online": cameras_online,
        "cameras_offline": cameras_offline,
        "open_alerts": open_alerts,
        "users_by_role": users_by_role,
    }
