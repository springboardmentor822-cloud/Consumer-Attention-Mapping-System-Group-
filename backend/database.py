from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
import datetime
import os

# Was previously a hardcoded PostgreSQL URL with a real plaintext password
# ("Pass@100") committed directly in this file — a serious secret-leak risk,
# especially for a project headed to a public GitHub repo. There is also no
# other evidence anywhere in this codebase (main.py, models.py, or any
# deployment config) that a Postgres server is actually expected to be
# running — every other piece of documentation in this project (README,
# main.py's own comments) describes a single-file, zero-setup local
# database, which SQLite provides and Postgres doesn't without separate
# provisioning. Defaulting to local SQLite here matches that reality
# instead of silently requiring infrastructure nothing else in the project
# assumes exists. If you DO want Postgres, set DATABASE_URL yourself —
# nothing here will fabricate or assume a password for you.
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./cams_retail.db")

# SQLite requires check_same_thread=False in this app specifically because
# main.py is genuinely multi-threaded — one thread per camera plus a
# background Re-ID processor thread, several of which write to the DB via
# SessionLocal(). Without this, SQLite raises "objects created in a thread
# can only be used in that same thread" the first time a non-request thread
# touches the DB. Postgres doesn't need or accept this argument, so it's
# only applied for sqlite:// URLs.
#
# timeout=15 sets SQLite's busy-timeout: SQLite only allows one writer at a
# time, and its C-level default is to fail IMMEDIATELY ("database is
# locked") if a second writer shows up mid-write, rather than wait. With 4
# camera threads plus a Re-ID background thread all potentially writing
# around the same moment (e.g. two shopper sessions completing within
# milliseconds of each other), that default would surface as random,
# hard-to-reproduce write failures under real load. 15s gives concurrent
# writers room to queue and retry instead of failing outright.
_connect_args = {"check_same_thread": False, "timeout": 15} if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=_connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ==========================================
# DATABASE SCHEMAS
# ==========================================

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String) 
    role = Column(String)

class POSTransaction(Base):
    __tablename__ = "pos_transactions"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    customer_id = Column(String, index=True)
    amount = Column(Float)
    # product_category and sku are currently DEAD columns — checked: the
    # webhook that creates every POSTransaction row (POSWebhookRequest in
    # main.py) doesn't even accept these as input fields, so they're never
    # populated, and nothing in main.py reads them back either (the one
    # place that queries this table, /api/v1/pos/live, only uses .amount
    # and .timestamp). Not a functional bug — nothing breaks — but worth
    # knowing before building anything that assumes real-time transactions
    # carry category/SKU data the way the static sales CSV does.
    product_category = Column(String)
    sku = Column(String)

# StoreZone (this exact class) used to live here, with a completely
# different schema (zone_name/x_coord/y_coord/width/height/is_camera_covered)
# from models.py's StoreZoneDB (id/label/x/y/w/h/category/camera_assigned) —
# the one main.py actually imports and uses everywhere (/api/v1/layout,
# the heatmap, the journey view, all of it). This class was never imported
# by main.py, so it only ever added a second, unused "store_zones" table
# alongside the real "store_layout_zones" table on every create_all(). A
# comment elsewhere in main.py already referenced "the StoreZone/StoreZoneDB
# note in database.py for the same class of issue" — that note is this one;
# the class itself has been removed rather than left as silent dead schema.
