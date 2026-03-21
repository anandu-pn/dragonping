import os
import psycopg2
from dotenv import load_dotenv
import uuid

load_dotenv()

db_url = os.getenv("DATABASE_URL")

try:
    conn = psycopg2.connect(db_url)
    conn.autocommit = True
    cursor = conn.cursor()
    
    # Add column
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50);")
        print("Column username added to users table.")
    except Exception as e:
        print(f"Error adding column: {e}")

    # Populate existing users with a generated username to allow setting UNIQUE constraint
    cursor.execute("SELECT id, email FROM users WHERE username IS NULL;")
    users = cursor.fetchall()
    
    for user_id, email in users:
        # Generate a slug from email or use uuid
        base_username = email.split('@')[0][:40] 
        # quick way to ensure it's likely unique for existing users
        unique_username = f"{base_username}_{str(uuid.uuid4())[:8]}"
        cursor.execute("UPDATE users SET username = %s WHERE id = %s;", (unique_username, user_id))
    
    print(f"Updated {len(users)} existing users with generated usernames.")

    # Add unique constraint (if it doesn't exist)
    try:
        cursor.execute("ALTER TABLE users ADD CONSTRAINT unique_username UNIQUE (username);")
        print("UNIQUE constraint added for username.")
    except Exception as e:
        print(f"Error adding unique constraint (might already exist): {e}")

    conn.close()
    
except Exception as e:
    print(f"Database error: {e}")
