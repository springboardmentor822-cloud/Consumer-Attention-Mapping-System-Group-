import sqlite3

db_path = "backend/attention.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("=== tracking_logs columns ===")
cursor.execute("PRAGMA table_info(tracking_logs);")
for col in cursor.fetchall():
    print(col)

print("\n=== product_interactions columns ===")
cursor.execute("PRAGMA table_info(product_interactions);")
for col in cursor.fetchall():
    print(col)

print("\n=== sessions columns ===")
cursor.execute("PRAGMA table_info(sessions);")
for col in cursor.fetchall():
    # id, shopper_identifier, store_id, start_time, end_time
    print(col)

conn.close()
