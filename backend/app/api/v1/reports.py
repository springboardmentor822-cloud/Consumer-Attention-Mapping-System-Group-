from fastapi import APIRouter, Depends, Response
from ...services.behavior_service import BehaviorService
from ..deps import get_current_user
from ...schemas.user import User

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/export")
def export_report(
    format: str = "csv",
    report_type: str = "attractiveness",
    current_user: User = Depends(get_current_user)
):
    if report_type == "attractiveness":
        data = BehaviorService.get_product_attractiveness_scores()
        if format == "csv":
            headers = ["SKU", "Product Name", "Category", "Shelf", "Attention Duration", "Interaction Freq", "Pickup Rate", "Conversion Rate", "Attractiveness Score", "Status"]
            rows = [f"{p['sku']},{p['name']},{p['category']},{p['shelf']},{p['attention']},{p['interaction']},{p['pickup']},{p['conversion']},{p['attractiveness_score']},{p['status']}" for p in data]
            csv_content = ",".join(headers) + "\n" + "\n".join(rows)
            return Response(content=csv_content, media_type="text/csv", headers={"Content-Disposition": f"attachment; filename=consumer_attention_report_{report_type}.csv"})
        else:
            text_summary = "CONSUMER ATTENTION MAPPING SYSTEM - ATTRACTIVENESS AUDIT REPORT\n" + "="*70 + "\n\n"
            for p in data:
                text_summary += f"SKU: {p['sku']} | Name: {p['name']} | Attractiveness Score: {p['attractiveness_score']}/100 | Status: {p['status']}\n"
            return Response(content=text_summary, media_type="text/plain", headers={"Content-Disposition": f"attachment; filename=consumer_attention_report_{report_type}.txt"})

    elif report_type == "behavior":
        segments = BehaviorService.get_shopper_segmentation()
        if format == "csv":
            headers = ["Segment", "Percentage", "Avg Dwell Time", "Avg Distance Walked", "Shopper Count"]
            rows = [f"{s['segment']},{s['percentage']},{s['avg_dwell_time']},{s['avg_distance']},{s['count']}" for s in segments]
            csv_content = ",".join(headers) + "\n" + "\n".join(rows)
            return Response(content=csv_content, media_type="text/csv", headers={"Content-Disposition": f"attachment; filename=shopper_behavior_report.csv"})
        else:
            text_summary = "SHOPPER BEHAVIOR SEGMENTATION REPORT\n" + "="*50 + "\n\n"
            for s in segments:
                text_summary += f"Segment: {s['segment']} ({s['percentage']}%) | Dwell: {s['avg_dwell_time']} | Distance: {s['avg_distance']}\n"
            return Response(content=text_summary, media_type="text/plain", headers={"Content-Disposition": f"attachment; filename=shopper_behavior_report.txt"})

    return {"message": "Report generated", "type": report_type, "format": format, "user": current_user.email}
