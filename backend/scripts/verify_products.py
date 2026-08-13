import sqlite3
import os

db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "attention.db"))

def verify_products():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # 1. Total products
    cursor.execute("SELECT COUNT(*) FROM products;")
    prod_count = cursor.fetchone()[0]
    
    # 2. Total interactions
    cursor.execute("SELECT COUNT(*) FROM product_interactions;")
    int_count = cursor.fetchone()[0]
    
    print(f"Total Products in DB: {prod_count}")
    print(f"Total Product Interactions in DB: {int_count}")
    
    # 3. Example product interaction entries
    print("\n=== EXAMPLE DATABASE ENTRIES (product_interactions) ===")
    cursor.execute("""
        SELECT pi.id, s.shopper_identifier, p.name, sh.name, pi.interaction_type, pi.timestamp 
        FROM product_interactions pi
        JOIN sessions s ON pi.session_id = s.id
        JOIN products p ON pi.product_id = p.id
        JOIN shelves sh ON pi.shelf_id = sh.id
        ORDER BY pi.timestamp DESC
        LIMIT 5;
    """)
    for row in cursor.fetchall():
        print(f"ID: {row[0][:8]}... | Shopper: {row[1]} | Prod: {row[2]} | Shelf: {row[3]} | Action: {row[4]:<8} | Time: {row[5]}")
        
    conn.close()

if __name__ == "__main__":
    verify_products()
