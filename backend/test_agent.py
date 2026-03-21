import requests

# Test backend health
r = requests.get('http://localhost:8000/health')
print('Backend health:', r.status_code, r.json())

# Test agent list endpoint requires auth
r2 = requests.get('http://localhost:8000/api/agent/list')
print('Agent list (no auth):', r2.status_code)

# Test metrics endpoint (no auth required)
r3 = requests.get('http://localhost:8000/api/agent/test-host/metrics')
print('Agent metrics:', r3.status_code, r3.json())
