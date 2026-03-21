import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
conn = psycopg2.connect(os.environ['DATABASE_URL'])
cur = conn.cursor()

cur.execute('SELECT s.id, s.name, u.username, s.is_public FROM services s LEFT JOIN users u ON s.user_id = u.id')
for row in cur.fetchall():
    print(row)
