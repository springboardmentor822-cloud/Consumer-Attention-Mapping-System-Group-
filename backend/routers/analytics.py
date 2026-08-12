from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import crud
import schemas

from database import get_db
from live_stats import get_stats, reset_stats
from behavior.behavior_engine import behavior_engine
from utils.auth_dependency import require_roles
from recommendation_engine import (
    generate_camera_recommendations,
    get_recommendation_summary,
    get_role_recommendations,
)
router = APIRouter()

SUPPORTED_CAMERAS = {1, 2}


# ==========================================================
# ANALYTICS TABLE
# ==========================================================

@router.get("/")
def get_analytics(
    db: Session = Depends(get_db),
):
    return crud.get_analytics(db)


# ==========================================================
# DASHBOARD ANALYTICS
# ==========================================================

@router.get(
    "/dashboard",
    response_model=schemas.DashboardAnalyticsResponse,
)
def dashboard_analytics(
    db: Session = Depends(get_db),
):
    return crud.get_dashboard_analytics(db)


# ==========================================================
# LIVE CAMERA ANALYTICS
# ==========================================================

@router.get("/live/{camera_id}")
def get_live_analytics(
    camera_id: int,
):
    if camera_id not in SUPPORTED_CAMERAS:
        raise HTTPException(
            status_code=404,
            detail="Invalid camera ID.",
        )

    stats = get_stats(camera_id)

    if stats is None:
        raise HTTPException(
            status_code=404,
            detail="Camera statistics not found.",
        )

    return stats


# ==========================================================
# RESET CAMERA
# ==========================================================

@router.post("/reset/{camera_id}")
def reset_live_stats(
    camera_id: int,
):
    if camera_id not in SUPPORTED_CAMERAS:
        raise HTTPException(
            status_code=404,
            detail="Invalid camera ID.",
        )

    reset_stats(camera_id)

    return {
        "message": f"Camera {camera_id} analytics reset successfully."
    }


# ==========================================================
# ALL CAMERAS
# ==========================================================

@router.get("/live")
def all_camera_live():
    return {
        1: get_stats(1),
        2: get_stats(2),
    }


# ==========================================================
# TRAJECTORY ANALYTICS
# ==========================================================

@router.get("/trajectory/{camera_id}")
def get_trajectory_analytics(
    camera_id: int,
):
    if camera_id not in SUPPORTED_CAMERAS:
        raise HTTPException(
            status_code=404,
            detail="Invalid camera ID.",
        )

    stats = get_stats(camera_id)

    if stats is None:
        raise HTTPException(
            status_code=404,
            detail="Camera statistics not found.",
        )

    trajectory = stats.get("trajectory") or {}

    return {
        "camera_id": camera_id,
        "trajectory_customers": stats.get(
            "trajectory_customers",
            0,
        ),
        "customers": trajectory,
    }


# ==========================================================
# TRAJECTORY SUMMARY
# ==========================================================

@router.get("/trajectory-summary/{camera_id}")
def get_trajectory_summary(
    camera_id: int,
):
    if camera_id not in SUPPORTED_CAMERAS:
        raise HTTPException(
            status_code=404,
            detail="Invalid camera ID.",
        )

    stats = get_stats(camera_id)

    if stats is None:
        raise HTTPException(
            status_code=404,
            detail="Camera statistics not found.",
        )

    trajectory = stats.get("trajectory", {})

    if not trajectory:
        return {
            "camera_id": camera_id,
            "customers": 0,
            "average_distance": 0,
            "average_speed": 0,
            "average_efficiency": 0,
        }

    total_distance = 0
    total_speed = 0
    total_efficiency = 0

    for customer in trajectory.values():

        total_distance += customer.get(
            "distance",
            0,
        )

        total_speed += customer.get(
            "average_speed",
            0,
        )

        total_efficiency += customer.get(
            "movement_efficiency",
            0,
        )

    count = len(trajectory)

    return {
        "camera_id": camera_id,
        "customers": count,
        "average_distance": round(
            total_distance / count,
            2,
        ),
        "average_speed": round(
            total_speed / count,
            2,
        ),
        "average_efficiency": round(
            total_efficiency / count,
            2,
        ),
    }


# ==========================================================
# ZONE TRANSITION ANALYTICS
# ==========================================================

@router.get("/zone-transition/{camera_id}")
def get_zone_transition(
    camera_id: int,
):
    if camera_id not in SUPPORTED_CAMERAS:
        raise HTTPException(
            status_code=404,
            detail="Invalid camera ID.",
        )

    stats = get_stats(camera_id)

    if stats is None:
        raise HTTPException(
            status_code=404,
            detail="Camera statistics not found.",
        )

    return {
        "camera_id": camera_id,
        "zone_transition": stats.get(
            "zone_transition",
            {},
        ),
        "zone_history": stats.get(
            "zone_history",
            {},
        ),
        "zone_transitions": stats.get(
            "zone_transitions",
            {},
        ),
        "customer_zone": stats.get(
            "customer_zone",
            {},
        ),
    }


# ==========================================================
# ZONE TRANSITION SUMMARY
# ==========================================================

@router.get("/zone-summary/{camera_id}")
def get_zone_summary(
    camera_id: int,
):
    if camera_id not in SUPPORTED_CAMERAS:
        raise HTTPException(
            status_code=404,
            detail="Invalid camera ID.",
        )

    stats = get_stats(camera_id)

    if stats is None:
        raise HTTPException(
            status_code=404,
            detail="Camera statistics not found.",
        )

    report = stats.get(
        "zone_transition",
        {},
    )

    return {
        "camera_id": camera_id,

        "total_transitions": report.get(
            "total_transitions",
            0,
        ),

        "most_common_transition": report.get(
            "most_common_transition",
            "None",
        ),

        "most_visited_zone": report.get(
            "most_visited_zone",
            "None",
        ),

        "least_visited_zone": report.get(
            "least_visited_zone",
            "None",
        ),

        "recommended_action": report.get(
            "recommended_action",
            "No recommendation",
        ),
    }


# ==========================================================
# CUSTOMER BEHAVIOUR + MILESTONE 3 SEGMENTATION
# ==========================================================

@router.get("/customer-behavior/{camera_id}")
def customer_behavior(
    camera_id: int,
):
    # ------------------------------------------------------
    # Validate camera
    # ------------------------------------------------------

    if camera_id not in SUPPORTED_CAMERAS:
        raise HTTPException(
            status_code=404,
            detail="Invalid camera ID.",
        )

    # ------------------------------------------------------
    # Get live camera statistics
    # ------------------------------------------------------

    stats = get_stats(camera_id)

    if stats is None:
        raise HTTPException(
            status_code=404,
            detail="Camera not found",
        )

    # ------------------------------------------------------
    # Existing customer data
    # ------------------------------------------------------

    customers = stats.get(
        "customers",
        {},
    )

    # ------------------------------------------------------
    # Existing behaviour analytics
    #
    # KEEPING THESE UNCHANGED
    # ------------------------------------------------------

    average_journey = (
        behavior_engine.average_journey(
            customers
        )
    )

    average_zones = (
        behavior_engine.average_zones(
            customers
        )
    )

    behaviour_distribution = (
        behavior_engine.distribution(
            customers
        )
    )

    customer_summary = (
        behavior_engine.customer_summary(
            customers
        )
    )

    # ------------------------------------------------------
    # NEW MILESTONE 3 SHOPPER SEGMENTATION
    # ------------------------------------------------------

    segment_distribution = (
        behavior_engine.segment_distribution(
            customers
        )
    )

    segment_details = (
        behavior_engine.segment_details(
            customers
        )
    )

    # ------------------------------------------------------
    # FINAL RESPONSE
    #
    # Existing fields are preserved.
    # New segmentation fields are added.
    # ------------------------------------------------------

    return {

        # Existing
        "camera_id":
            camera_id,

        "average_journey":
            average_journey,

        "average_zones":
            average_zones,

        "behaviour_distribution":
            behaviour_distribution,

        "customer_summary":
            customer_summary,

        # NEW MILESTONE 3
        "segment_distribution":
            segment_distribution,

        "segment_details":
            segment_details,
    }
    
# ==========================================================
# RECOMMENDATION & OPTIMIZATION ENGINE
# ==========================================================

@router.get("/recommendations/{camera_id}")
def get_recommendations(
    camera_id: int,
    role: str = "admin",
):
    """
    Generate actionable recommendations for a camera.

    Existing analytics are used as input.
    No existing analytics functionality is modified.
    """

    if camera_id not in SUPPORTED_CAMERAS:
        raise HTTPException(
            status_code=404,
            detail="Invalid camera ID.",
        )

    stats = get_stats(camera_id)

    if stats is None:
        raise HTTPException(
            status_code=404,
            detail="Camera statistics not found.",
        )

    # ------------------------------------------------------
    # Generate recommendations
    # ------------------------------------------------------

    recommendations = generate_camera_recommendations(
        camera_stats=stats,
        camera_id=camera_id,
    )

    # ------------------------------------------------------
    # Filter according to requested role
    # ------------------------------------------------------

    role_recommendations = get_role_recommendations(
        recommendations,
        role,
    )

    # ------------------------------------------------------
    # Summary
    # ------------------------------------------------------

    summary = get_recommendation_summary(
        role_recommendations
    )

    return {
        "camera_id": camera_id,
        "role": role,
        "recommendations": role_recommendations,
        "summary": summary,
    }