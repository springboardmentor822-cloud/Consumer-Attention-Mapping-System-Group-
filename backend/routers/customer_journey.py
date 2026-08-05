from fastapi import APIRouter, HTTPException

from ai_detector import (
    get_all_customer_journeys,
    get_customer_journey,
    get_active_customers,
    get_exited_customers,
    reset_customer_journeys,
)

router = APIRouter(
    prefix="/customer-journey",
    tags=["Customer Journey"],
)


# ==========================================================
# GET ALL CUSTOMER JOURNEYS
# ==========================================================

@router.get("/")
def get_all():

    return {
        "success": True,
        "count": len(get_all_customer_journeys()),
        "customers": get_all_customer_journeys(),
    }


# ==========================================================
# GET ACTIVE CUSTOMERS
# ==========================================================

@router.get("/active")
def active_customers():

    customers = get_active_customers()

    return {
        "success": True,
        "count": len(customers),
        "customers": customers,
    }


# ==========================================================
# GET EXITED CUSTOMERS
# ==========================================================

@router.get("/exited")
def exited_customers():

    customers = get_exited_customers()

    return {
        "success": True,
        "count": len(customers),
        "customers": customers,
    }


# ==========================================================
# GET SINGLE CUSTOMER
# ==========================================================

@router.get("/{track_id}")
def customer(track_id: int):

    customer = get_customer_journey(track_id)

    if customer is None:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    return {
        "success": True,
        "customer": customer,
    }


# ==========================================================
# RESET CUSTOMER JOURNEYS
# ==========================================================

@router.post("/reset")
def reset():

    reset_customer_journeys()

    return {
        "success": True,
        "message": "Customer Journey data cleared successfully."
    }