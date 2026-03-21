import requests
import json
import traceback

try:
    response = requests.get('http://localhost:8000/api/public/status/nandu')
    print("STATUS CODE:", response.status_code)
    print("RESPONSE BODY:", response.text)
except Exception as e:
    traceback.print_exc()
