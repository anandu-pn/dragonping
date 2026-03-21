import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

# Get DB URL and convert it if needed for psycopg2
db_url = os.getenv("DATABASE_URL")
if db_url.startswith("postgresql://"):
    pass # psycopg2 can handle this format

try:
    conn = psycopg2.connect(db_url)
    conn.autocommit = True
    cursor = conn.cursor()
    cursor.execute("ALTER TABLE services ADD COLUMN IF NOT EXISTS user_id INTEGER;")
    
    # Ideally we'd add the foreign key constraint:
    try:
        cursor.execute("ALTER TABLE services ADD CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES users(id);")
        print("Foreign key added successfully.")
    except Exception as e:
        print(f"Foreign key constraint error (might already exist): {e}")

    print("Column user_id added to services table.")
    conn.close()
except Exception as e:
    print(f"Error altering database: {e}")
