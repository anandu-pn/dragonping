import requests
import time
import random
import json
import sys

BASE_URL = "http://localhost:8000"
HOSTNAME = "test-node-01"
USERNAME = "admin@example.com"
PASSWORD = "AdminPassword123!@#"

def register():
    print(f"[*] Registering agent '{HOSTNAME}'...")
    try:
        resp = requests.post(f"{BASE_URL}/api/agent/register", json={
            "username": USERNAME,
            "password": PASSWORD,
            "hostname": HOSTNAME,
            "device_label": "Mock Server Node"
        })
        if resp.status_code == 200:
            token = resp.json().get("token")
            print(f"[+] Registration successful. Token obtained.")
            return token
        else:
            print(f"[-] Registration failed: {resp.status_code} - {resp.text}")
            return None
    except Exception as e:
        print(f"[-] Error connecting to backend: {e}")
        return None

def send_heartbeat(token):
    # Simulate random metrics
    cpu = round(random.uniform(5, 85), 2)
    ram_total = 16384
    ram_used = random.randint(2000, 14000)
    ram_pct = round((ram_used / ram_total) * 100, 2)
    
    disk_total = 500
    disk_used = random.randint(50, 450)
    disk_pct = round((disk_used / disk_total) * 100, 2)
    
    net_rx = random.randint(1000, 1000000)
    net_tx = random.randint(1000, 1000000)
    
    processes = json.dumps([
        {"pid": 1234, "name": "python", "cpu": 5.2, "mem": 1.1},
        {"pid": 5678, "name": "node", "cpu": 12.5, "mem": 3.4},
        {"pid": 9012, "name": "postgres", "cpu": 1.2, "mem": 0.5}
    ])

    payload = {
        "hostname": HOSTNAME,
        "cpu_percent": cpu,
        "ram_percent": ram_pct,
        "ram_used_mb": ram_used,
        "ram_total_mb": ram_total,
        "disk_percent": disk_pct,
        "disk_used_gb": disk_used,
        "disk_total_gb": disk_total,
        "net_rx_bytes": net_rx,
        "net_tx_bytes": net_tx,
        "processes": processes
    }

    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        resp = requests.post(f"{BASE_URL}/api/agent/heartbeat", json=payload, headers=headers)
        if resp.status_code == 200:
            print(f"[+] Heartbeat sent: CPU {cpu}%, RAM {ram_pct}%")
        else:
            print(f"[-] Heartbeat failed: {resp.status_code} - {resp.text}")
    except Exception as e:
        print(f"[-] Error sending heartbeat: {e}")

def main():
    token = register()
    if not token:
        sys.exit(1)
    
    print("[*] Starting heartbeat loop (Ctrl+C to stop)...")
    try:
        while True:
            send_heartbeat(token)
            time.sleep(10) # Send every 10 seconds
    except KeyboardInterrupt:
        print("\n[*] Stopping agent mimic.")

if __name__ == "__main__":
    main()
