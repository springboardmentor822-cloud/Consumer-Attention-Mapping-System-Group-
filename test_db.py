import sys
import os
from sqlalchemy import text

# Add backend to path so we can import app modules
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

try:
    from app.db import engine, Base
    from app.models import models
    
    print("Attempting to connect to PostgreSQL and create tables...")
    # This will trigger db.py and create_engine, which logs to console
    # Then we explicitly create all tables
    Base.metadata.create_all(bind=engine)
    
    with engine.connect() as conn:
        result = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
        tables = [row[0] for row in result]
        
    print("\nSuccessfully connected to PostgreSQL!")
    print(f"Found {len(tables)} tables in the database.")
    for table in tables:
        print(f" - {table}")
        
except Exception as e:
    print(f"Error connecting to database: {e}")
    sys.exit(1)
