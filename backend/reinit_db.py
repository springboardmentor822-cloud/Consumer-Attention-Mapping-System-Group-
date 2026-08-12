import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.core.database import Base, engine
from app.models.user import User
from app.models.store import Store, Zone, Shelf, Product, Camera, ProductCategory

def reinit():
    print("Dropping shelves & products tables if exist...")
    with engine.connect() as conn:
        conn.execute(text("DROP TABLE IF EXISTS products CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS shelves CASCADE"))
        conn.commit()
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)
    print("Database successfully re-initialized!")

if __name__ == "__main__":
    reinit()
