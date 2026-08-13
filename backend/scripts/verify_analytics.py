import sqlite3
import os

db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "attention.db"))

def verify_data():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("=== SESSIONS SUMMARY ===")
    cursor.execute("""
        SELECT segment, COUNT(*), AVG(path_distance), AVG(duration_seconds), AVG(velocity)
        FROM sessions
        GROUP BY segment;
    """)
    rows = cursor.fetchall()
    for row in rows:
        print(f"Segment: {row[0]:<20} | Count: {row[1]:<3} | Avg Dist: {row[2]:.2f}px | Avg Dwell: {row[3]:.1f}s | Avg Vel: {row[4]:.2f}px/s")
        
    print("\n=== RECENT INTERACTION LOGS ===")
    cursor.execute("""
        SELECT session_id, product_id, shelf_id, interaction_type, timestamp 
        FROM product_interactions
        ORDER BY timestamp DESC
        LIMIT 5;
    """)
    for row in cursor.fetchall():
        print(f"Sess: {row[0]} | Prod: {row[1]} | Shelf: {row[2]} | Type: {row[3]} | Time: {row[4]}")
        
    conn.close()

if __name__ == "__main__":
    verify_data()
