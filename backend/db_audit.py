import sqlite3

db_path = "backend/attention.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get 10 Sample Rows from product_interactions joined with sessions
print("=== Product Interactions Sample (Joined on Sessions) ===")
try:
    cursor.execute("""
        SELECT s.shopper_identifier, p.product_id, p.shelf_id, p.interaction_type, p.timestamp 
        FROM product_interactions p
        JOIN sessions s ON p.session_id = s.id
        LIMIT 10;
    """)
    rows = cursor.fetchall()
    if not rows:
        print("No dynamic product interactions recorded in database.")
    for row in rows:
        print(f"Shopper: {row[0]} | Product: {row[1]} | Shelf: {row[2]} | Event: {row[3]} | Time: {row[4]}")
except Exception as e:
    print(f"Error: {e}")

conn.close()
