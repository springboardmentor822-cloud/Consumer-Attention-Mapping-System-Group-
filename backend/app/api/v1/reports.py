from fastapi import APIRouter, Depends, Response
from ...services.behavior_service import BehaviorService
from ..deps import get_current_user
from ...schemas.user import User

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/export")
def export_report(format: str = "csv", report_type: str = "attractiveness", current_user: User = Depends(get_current_user)):
    if report_type == "attractiveness":
        data = BehaviorService.get_product_attractiveness_scores()
        headers = ["SKU", "Product Name", "Category", "Shelf", "Attention Duration", "Interaction Freq", "Pickup Rate", "Conversion Rate", "Attractiveness Score", "Status"]
        rows = [f"{p['sku']},{p['name']},{p['category']},{p['shelf']},{p['attention']},{p['interaction']},{p['pickup']},{p['conversion']},{p['attractiveness_score']},{p['status']}" for p in data]
        csv_content = ",".join(headers) + "\n" + "\n".join(rows)
        return Response(content=csv_content, media_type="text/csv", headers={"Content-Disposition": f"attachment; filename=consumer_attention_report_{report_type}.csv"})

    return {"message": "Report generated", "type": report_type, "format": format}
