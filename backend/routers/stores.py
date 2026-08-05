from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import crud
import schemas
from database import get_db
from utils.auth_dependency import require_roles

router = APIRouter()


# ==========================================================
# GET ALL STORES
# Admin + Store Manager
# ==========================================================

@router.get("/", response_model=list[schemas.StoreResponse])
def get_all_stores(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            "Admin",
            "Store Manager"
        )
    ),
):

    return crud.get_stores(db)


# ==========================================================
# GET STORE BY ID
# Admin + Store Manager
# ==========================================================

@router.get("/{store_id}", response_model=schemas.StoreResponse)
def get_store(
    store_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            "Admin",
            "Store Manager"
        )
    ),
):

    store = crud.get_store(
        db,
        store_id
    )

    if store is None:

        raise HTTPException(
            status_code=404,
            detail="Store not found"
        )

    return store


# ==========================================================
# CREATE STORE
# Admin + Store Manager
# ==========================================================

@router.post("/", response_model=schemas.StoreResponse)
def create_store(
    store: schemas.StoreCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            "Admin",
            "Store Manager"
        )
    ),
):

    return crud.create_store(
        db,
        store
    )


# ==========================================================
# UPDATE STORE
# Admin + Store Manager
# ==========================================================

@router.put("/{store_id}", response_model=schemas.StoreResponse)
def update_store(
    store_id: int,
    store: schemas.StoreCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            "Admin",
            "Store Manager"
        )
    ),
):

    updated_store = crud.update_store(
        db,
        store_id,
        store
    )

    if updated_store is None:

        raise HTTPException(
            status_code=404,
            detail="Store not found"
        )

    return updated_store


# ==========================================================
# DELETE STORE
# Admin + Store Manager
# ==========================================================

@router.delete("/{store_id}")
def delete_store(
    store_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            "Admin",
            "Store Manager"
        )
    ),
):

    deleted = crud.delete_store(
        db,
        store_id
    )

    if not deleted:

        raise HTTPException(
            status_code=404,
            detail="Store not found"
        )

    return {
        "message": "Store deleted successfully"
    }