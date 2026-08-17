import os
import sqlite3
import psycopg2
import logging
from pathlib import Path
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

# Load backend .env file
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

DB_HOST = os.environ.get("DB_HOST", "localhost")
DB_PORT = os.environ.get("DB_PORT", "5432")
DB_NAME = os.environ.get("DB_NAME", "attention_db")
DB_USER = os.environ.get("DB_USER", "postgres")
DB_PASSWORD = os.environ.get("DB_PASSWORD", "")
USE_SQLITE = os.environ.get("USE_SQLITE", "false").lower() == "true"
DB_STORAGE = os.environ.get("DB_STORAGE", "./database/dev.sqlite")

def get_connection():
    """
    Returns a new database connection (PostgreSQL or SQLite based on configuration).
    The caller is responsible for closing it.
    """
    if USE_SQLITE:
        sqlite_path = Path(__file__).parent.parent / DB_STORAGE
        conn = sqlite3.connect(sqlite_path)
        conn.row_factory = sqlite3.Row
        return conn
    else:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD
        )
        return conn

def execute_query(query, params=None, fetch=True, commit=False):
    """
    Helper to execute a SQL query safely, returning results or committing updates.
    """
    conn = get_connection()
    try:
        if USE_SQLITE:
            query = query.replace("%s", "?")
            cursor = conn.cursor()
            cursor.execute(query, params or ())
            if fetch:
                if cursor.description:
                    columns = [col[0] for col in cursor.description]
                    results = [dict(zip(columns, row)) for row in cursor.fetchall()]
                    return results
                return []
            if commit:
                conn.commit()
                return cursor.lastrowid
        else:
            cursor = conn.cursor()
            cursor.execute(query, params or ())
            if fetch:
                if cursor.description:
                    columns = [col[0] for col in cursor.description]
                    results = [dict(zip(columns, row)) for row in cursor.fetchall()]
                    return results
                return []
            if commit:
                conn.commit()
                # If query was an INSERT RETURNING
                try:
                    return cursor.fetchone()[0]
                except Exception:
                    return None
    except Exception as e:
        logger.error(f"Database query failed: {query} with params {params}. Error: {e}")
        if commit:
            conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    # Test connection
    try:
        print("Testing Python DB wrapper connection...")
        if USE_SQLITE:
            print("Configured for SQLite.")
        else:
            print("Configured for PostgreSQL.")
        
        conn = get_connection()
        print("Database connection successful!")
        conn.close()
    except Exception as exc:
        print("Database connection failed:", exc)
