import requests

r = requests.get('http://localhost:8000/api/public/status/nandu@example.com')
print("STATUS", r.status_code)
print("TEXT", r.text)
