import sqlite3

def add_column(db_path):
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("ALTER TABLE checks ADD COLUMN cert_expiry_days INTEGER")
        conn.commit()
        print(f"Column added to {db_path}")
    except sqlite3.OperationalError as e:
        print(f"Error {db_path}: {e}")
    finally:
        conn.close()

add_column("app.db")
add_column("test.db")
