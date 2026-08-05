from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import crud
import schemas
from database import get_db
from utils.auth_dependency import require_roles

router = APIRouter()


# ==========================================================
# GET ALL PRODUCTS
# Admin + Store Manager
# ==========================================================

@router.get("/", response_model=list[schemas.ProductResponse])
def get_all_products(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            "Admin",
            "Store Manager"
        )
    ),
):
    return crud.get_products(db)


# ==========================================================
# GET PRODUCT BY ID
# Admin + Store Manager
# ==========================================================

@router.get("/{product_id}", response_model=schemas.ProductResponse)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            "Admin",
            "Store Manager"
        )
    ),
):

    product = crud.get_product(
        db,
        product_id
    )

    if product is None:

        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    return product


# ==========================================================
# CREATE PRODUCT
# Admin + Store Manager
# ==========================================================

@router.post("/", response_model=schemas.ProductResponse)
def create_product(
    product: schemas.ProductCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            "Admin",
            "Store Manager"
        )
    ),
):

    return crud.create_product(
        db,
        product
    )


# ==========================================================
# UPDATE PRODUCT
# Admin + Store Manager
# ==========================================================

@router.put("/{product_id}", response_model=schemas.ProductResponse)
def update_product(
    product_id: int,
    product: schemas.ProductCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            "Admin",
            "Store Manager"
        )
    ),
):

    updated = crud.update_product(
        db,
        product_id,
        product
    )

    if updated is None:

        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    return updated


# ==========================================================
# DELETE PRODUCT
# Admin + Store Manager
# ==========================================================

@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            "Admin",
            "Store Manager"
        )
    ),
):

    deleted = crud.delete_product(
        db,
        product_id
    )

    if not deleted:

        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    return {
        "message": "Product deleted successfully"
    }