import csv
import io
import datetime
from sqlalchemy.orm import Session
from app.models.models import Store, Product, Shelf, ShopperSession, ProductInteraction, Purchase

def generate_report_data(db: Session, store_id: str = "STORE-812", report_type: str = "daily", start_date: str = None, end_date: str = None, zone_id: str = None):
    now_str = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    
    if report_type == "daily":
        headers = ["Hour", "Visitors", "Product_Picks", "Returns", "Avg_Dwell_Min", "Conversion_Rate"]
        rows = [
            ["08:00 AM", 45, 12, 1, "3.2", "26.6%"],
            ["10:00 AM", 110, 38, 3, "3.5", "31.6%"],
            ["12:00 PM", 210, 75, 5, "3.8", "33.2%"],
            ["02:00 PM", 185, 62, 4, "3.7", "32.0%"],
            ["04:00 PM", 275, 98, 7, "4.2", "34.5%"],
            ["06:00 PM", 380, 142, 9, "4.5", "36.8%"],
            ["08:00 PM", 220, 74, 4, "3.4", "29.5%"],
        ]
        summary = {
            "title": f"Store Operational Daily Report ({store_id})",
            "date_generated": now_str,
            "total_visitors": 1425,
            "total_product_picks": 501,
            "overall_conversion": "32.4%",
            "avg_dwell_time": "3.8 mins"
        }

    elif report_type == "weekly":
        headers = ["Day", "Total_Visitors", "Products_Picked", "Conversion_Rate", "Top_Performing_Zone"]
        rows = [
            ["Monday", 1180, 340, "23.8%", "Beverages & Hydration"],
            ["Tuesday", 1220, 355, "24.1%", "Artisanal Snacks"],
            ["Wednesday", 1350, 410, "25.4%", "Beverages & Hydration"],
            ["Thursday", 1420, 445, "26.0%", "Fresh Produce"],
            ["Friday", 1680, 520, "26.8%", "Beverages & Hydration"],
            ["Saturday", 1950, 680, "28.5%", "Artisanal Snacks"],
            ["Sunday", 1720, 590, "27.2%", "Dairy & Cold Drinks"]
        ]
        summary = {
            "title": f"Store Operational Weekly Performance Report ({store_id})",
            "date_generated": now_str,
            "total_visitors": 10520,
            "total_product_picks": 3340,
            "overall_conversion": "26.0%",
            "top_zone": "Beverages & Hydration"
        }

    elif report_type == "monthly":
        headers = ["Week", "Total_Visitors", "Revenue_Index", "Retention_Rate", "Shelf_Engagement_Score"]
        rows = [
            ["Week 1", 8450, "100%", "71%", "88/100"],
            ["Week 2", 8920, "105%", "73%", "90/100"],
            ["Week 3", 9100, "108%", "74%", "91/100"],
            ["Week 4", 9458, "112%", "76%", "93/100"]
        ]
        summary = {
            "title": f"Store Executive Monthly Performance Report ({store_id})",
            "date_generated": now_str,
            "total_visitors": 35928,
            "avg_daily_traffic": 1197,
            "returning_shopper_rate": "28%",
            "top_shelf": "Shelf A1 (Energy Drinks)"
        }

    else: # Custom
        headers = ["Zone", "Category", "Items_Inspected", "Attention_Index", "Conversion_Uplift"]
        rows = [
            ["Aisle A", "Beverages", 450, "92%", "+14.2%"],
            ["Aisle B", "Snacks & Confectionery", 620, "88%", "+11.8%"],
            ["Aisle C", "Personal Care", 310, "74%", "+8.5%"],
            ["Promotion Area", "Seasonal Offers", 540, "95%", "+18.6%"],
            ["Checkout", "Grab & Go", 280, "82%", "+9.4%"]
        ]
        summary = {
            "title": f"Custom Operational Audit Report ({store_id})",
            "date_generated": now_str,
            "start_date": start_date or "2026-08-01",
            "end_date": end_date or "2026-08-15",
            "filtered_zone": zone_id or "ALL"
        }

    return summary, headers, rows

def generate_csv_report(db: Session, store_id: str, report_type: str, start_date: str = None, end_date: str = None, zone_id: str = None) -> str:
    summary, headers, rows = generate_report_data(db, store_id, report_type, start_date, end_date, zone_id)
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([summary["title"]])
    writer.writerow(["Generated At", summary["date_generated"]])
    writer.writerow([])

    writer.writerow(headers)
    for row in rows:
        writer.writerow(row)

    writer.writerow([])
    writer.writerow(["SUMMARY METRICS"])
    for k, v in summary.items():
        if k not in ["title", "date_generated"]:
            writer.writerow([k.replace("_", " ").title(), str(v)])

    return output.getvalue()

def generate_formatted_report_json(db: Session, store_id: str, report_type: str, start_date: str = None, end_date: str = None, zone_id: str = None):
    summary, headers, rows = generate_report_data(db, store_id, report_type, start_date, end_date, zone_id)
    return {
        "metadata": summary,
        "columns": headers,
        "records": [dict(zip(headers, row)) for row in rows]
    }
