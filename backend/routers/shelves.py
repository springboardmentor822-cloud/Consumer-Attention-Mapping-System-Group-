from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import traceback

import crud
import schemas
from database import get_db
from utils.auth_dependency import require_roles

router = APIRouter()


# ==========================================================
# GET ALL SHELVES
# Admin + Store Manager
# ==========================================================

@router.get("/", response_model=list[schemas.ShelfResponse])
def get_all_shelves(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            "Admin",
            "Store Manager"
        )
    ),
):
    return crud.get_shelves(db)


# ==========================================================
# GET SHELF BY ID
# Admin + Store Manager
# ==========================================================

@router.get("/{shelf_id}", response_model=schemas.ShelfResponse)
def get_shelf(
    shelf_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            "Admin",
            "Store Manager"
        )
    ),
):

    shelf = crud.get_shelf(
        db,
        shelf_id
    )

    if shelf is None:

        raise HTTPException(
            status_code=404,
            detail="Shelf not found"
        )

    return shelf


# ==========================================================
# CREATE SHELF
# Admin + Store Manager
# ==========================================================

@router.post("/", response_model=schemas.ShelfResponse)
def create_shelf(
    shelf: schemas.ShelfCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            "Admin",
            "Store Manager"
        )
    ),
):
    try:
        return crud.create_shelf(db, shelf)

    except Exception as e:
        print("\n========== SHELF ERROR ==========")
        traceback.print_exc()
        print("================================\n")
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================================
# UPDATE SHELF
# Admin + Store Manager
# ==========================================================

@router.put("/{shelf_id}", response_model=schemas.ShelfResponse)
def update_shelf(
    shelf_id: int,
    shelf: schemas.ShelfCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            "Admin",
            "Store Manager"
        )
    ),
):

    updated = crud.update_shelf(
        db,
        shelf_id,
        shelf
    )

    if updated is None:

        raise HTTPException(
            status_code=404,
            detail="Shelf not found"
        )

    return updated


# ==========================================================
# DELETE SHELF
# Admin + Store Manager
# ==========================================================

@router.delete("/{shelf_id}")
def delete_shelf(
    shelf_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            "Admin",
            "Store Manager"
        )
    ),
):

    deleted = crud.delete_shelf(
        db,
        shelf_id
    )

    if not deleted:

        raise HTTPException(
            status_code=404,
            detail="Shelf not found"
        )

    return {
        "message": "Shelf deleted successfully"
    }