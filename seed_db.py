import os
import pandas as pd
import datetime
from database import SessionLocal, POSTransaction, engine, Base

# Ensure the database tables exist before trying to insert data
Base.metadata.create_all(bind=engine)

# Exact path to your dataset file
CSV_FILE_PATH = r"C:\Projects\VisionRetail_Project\Consumer-Attention-Mapping-System-Group-\frontend\public\datasets\supermarket_sales - Sheet1.csv"
def run_migration():
    db = SessionLocal()
    
    try:
        # 1. Prevent duplicate seeding
        existing_count = db.query(POSTransaction).count()
        if existing_count > 0:
            print(f"⚠️ Database already contains {existing_count} transactions. Skipping migration to prevent duplicates.")
            return

        print(f"📂 Loading dataset from {CSV_FILE_PATH}...")
        df = pd.read_csv(CSV_FILE_PATH)
        
        transactions = []
        
        # 2. Iterate through the CSV and map it to our SQL Table
        print("🔄 Mapping rows to SQLAlchemy models...")
        for index, row in df.iterrows():
            
            # Safely combine Date and Time into a Python datetime object
            try:
                date_str = f"{row['Date']} {row['Time']}"
                dt = pd.to_datetime(date_str).to_pydatetime()
            except Exception:
                dt = datetime.datetime.utcnow() # Fallback if time parsing fails

            # Map the CSV columns to the POSTransaction model
            tx = POSTransaction(
                timestamp=dt,
                customer_id=str(row.get('Invoice ID', f'MOCK-{index}')),
                amount=float(row.get('Total', 0.0)),
                product_category=str(row.get('Product line', 'Unknown')),
                # Reusing our SKU prefix logic from earlier
                sku=str(row.get('Product line', 'UNK'))[:3].upper() + "-00X" 
            )
            transactions.append(tx)
            
        print(f"🚀 Inserting {len(transactions)} records into the database...")
        
        # 3. Bulk save is much faster than committing row-by-row
        db.bulk_save_objects(transactions)
        db.commit()
        
        print("✅ Migration complete! Your SQL database is now fully populated.")
        
    except FileNotFoundError:
        print(f"❌ Error: Could not find the CSV file at '{CSV_FILE_PATH}'. Please update the path.")
    except Exception as e:
        print(f"❌ An error occurred during migration: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    run_migration()