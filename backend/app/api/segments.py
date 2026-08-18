import uuid

from fastapi import APIRouter, Depends

from app.core.deps import require_roles
from app.services.shopper_segments_read import get_segment_distribution

# ROLE CHECK ADDED: no auth dependency existed at all before - anyone
# with the URL could read this, no token required. Segmentation is a
# Retail Analyst-only section per Roles_Based_Dashboard.pdf (Store
# Manager's spec doesn't include it), so this is tighter than the other
# analytics endpoints on purpose - Analyst + SuperAdmin only.
router = APIRouter()


@router.get("/{store_id}/cameras/{camera_id}/segments")
def get_camera_segments(
    store_id: uuid.UUID,
    camera_id: uuid.UUID,
    _=Depends(require_roles("Analyst", "SuperAdmin")),
):
    # No 404 case - an empty distribution (segments never run for this
    # camera) is a normal 200 with zeroed counts, same treatment as the
    # attractiveness history endpoint, not an error.
    return get_segment_distribution(camera_id)
