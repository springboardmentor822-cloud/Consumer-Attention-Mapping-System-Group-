import sqlite3
import os

db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "attention.db"))

def alter_db():
    if not os.path.exists(db_path):
        print("Database not found.")
        return
        
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    columns = [
        ("path_distance", "REAL DEFAULT 0.0"),
        ("velocity", "REAL DEFAULT 0.0"),
        ("stopping_events", "INTEGER DEFAULT 0"),
        ("shelf_visit_count", "INTEGER DEFAULT 0"),
        ("interaction_count", "INTEGER DEFAULT 0"),
        ("segment", "TEXT DEFAULT 'Explorer'")
    ]
    
    for col_name, col_type in columns:
        try:
            cursor.execute(f"ALTER TABLE sessions ADD COLUMN {col_name} {col_type}")
            print(f"Added column {col_name} to sessions table.")
        except sqlite3.OperationalError as e:
            # Column already exists
            print(f"Column {col_name} check: {e}")
            
    conn.commit()
    conn.close()
    print("Database alteration complete.")

if __name__ == "__main__":
    alter_db()
