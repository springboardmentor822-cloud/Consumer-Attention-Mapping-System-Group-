from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import crud
import schemas
from database import get_db
from utils.auth_dependency import require_roles

router = APIRouter()


# ==========================================================
# GET ALL CAMERAS
# Admin + Store Manager
# ==========================================================

@router.get("/", response_model=list[schemas.CameraResponse])
def get_all_cameras(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            "Admin",
            "Store Manager"
        )
    ),
):
    return crud.get_cameras(db)


# ==========================================================
# GET CAMERA BY ID
# Admin + Store Manager
# ==========================================================

@router.get("/{camera_id}", response_model=schemas.CameraResponse)
def get_camera(
    camera_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            "Admin",
            "Store Manager"
        )
    ),
):

    camera = crud.get_camera(
        db,
        camera_id
    )

    if camera is None:

        raise HTTPException(
            status_code=404,
            detail="Camera not found"
        )

    return camera


# ==========================================================
# CREATE CAMERA
# Admin + Store Manager
# ==========================================================

@router.post("/", response_model=schemas.CameraResponse)
def create_camera(
    camera: schemas.CameraCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            "Admin",
            "Store Manager"
        )
    ),
):
    try:
        return crud.create_camera(db, camera)

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ==========================================================
# UPDATE CAMERA
# Admin + Store Manager
# ==========================================================

@router.put("/{camera_id}", response_model=schemas.CameraResponse)
def update_camera(
    camera_id: int,
    camera: schemas.CameraCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            "Admin",
            "Store Manager"
        )
    ),
):

    updated = crud.update_camera(
        db,
        camera_id,
        camera
    )

    if updated is None:

        raise HTTPException(
            status_code=404,
            detail="Camera not found"
        )

    return updated


# ==========================================================
# DELETE CAMERA
# Admin + Store Manager
# ==========================================================

@router.delete("/{camera_id}")
def delete_camera(
    camera_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            "Admin",
            "Store Manager"
        )
    ),
):

    deleted = crud.delete_camera(
        db,
        camera_id
    )

    if not deleted:

        raise HTTPException(
            status_code=404,
            detail="Camera not found"
        )

    return {
        "message": "Camera deleted successfully"
    }