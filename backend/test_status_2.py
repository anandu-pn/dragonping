import os
import psycopg2
from dotenv import load_dotenv
import requests

load_dotenv()
conn = psycopg2.connect(os.environ['DATABASE_URL'])
cur = conn.cursor()

# Get nandu's user_id
cur.execute("SELECT id FROM users WHERE username='nandu'")
user_id = cur.fetchone()[0]

# Add fresh service
cur.execute("INSERT INTO services (name, url, type, protocol, is_public, user_id, active) VALUES ('Fresh Service', 'https://example.com', 'website', 'https', True, %s, True) RETURNING id", (user_id,))
service_id = cur.fetchone()[0]
conn.commit()

# Hit endpoint
response = requests.get('http://localhost:8000/api/public/status/nandu')
print('STATUS', response.status_code)
print('TEXT', response.text)
