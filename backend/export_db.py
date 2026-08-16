import os
import json
import datetime
from sqlalchemy import text
from app.core.database import SessionLocal

def datetime_serializer(obj):
    if isinstance(obj, (datetime.datetime, datetime.date)):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")

def export_database():
    db = SessionLocal()
    export_dir = os.path.join(os.path.dirname(__file__), 'exports')
    os.makedirs(export_dir, exist_ok=True)
    
    tables = [
        "users",
        "stores",
        "shelves",
        "products",
        "shelf_products",
        "cameras",
        "shopper_positions"
    ]
    
    print(f"Starting database export to: {export_dir}")
    
    for table in tables:
        try:
            # Query all rows using raw SQL to make it simple and column-complete
            result = db.execute(text(f"SELECT * FROM {table};"))
            columns = result.keys()
            rows = [dict(zip(columns, row)) for row in result.fetchall()]
            
            output_file = os.path.join(export_dir, f"{table}.json")
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(rows, f, default=datetime_serializer, indent=2)
                
            print(f"  Exported table '{table}': {len(rows)} rows saved to {output_file}")
            
        except Exception as e:
            print(f"  Error exporting table '{table}': {e}")
            
    db.close()
    print("Database export completed.")

if __name__ == "__main__":
    export_database()
