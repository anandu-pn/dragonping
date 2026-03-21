import time
import random
import requests
import json
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

BASE_URL = "http://localhost:8000/api/agent"
USERNAME = "nandu@example.com"
PASSWORD = "12345678"
HOSTNAME = "fake-server-01"
DEVICE_LABEL = "Ubuntu Web Server (Fake)"

def register_agent():
    logging.info(f"Registering fake agent {HOSTNAME}...")
    try:
        req = requests.post(f"{BASE_URL}/register", json={
            "username": USERNAME,
            "password": PASSWORD,
            "hostname": HOSTNAME,
            "device_label": DEVICE_LABEL
        })
        if req.status_code == 200:
            token = req.json().get("token")
            logging.info("Successfully registered! Got token.")
            return token
        else:
            logging.error(f"Registration failed: {req.status_code} - {req.text}")
            return None
    except Exception as e:
        logging.error(f"Error connecting: {e}")
        return None

def generate_fake_metrics():
    # Base values that slightly fluctuate
    cpu = random.uniform(10.0, 85.0)
    ram_total = 16384
    ram_used = random.randint(4096, 14000)
    ram_percent = (ram_used / ram_total) * 100
    
    disk_total = 500
    disk_used = random.randint(200, 450)
    disk_percent = (disk_used / disk_total) * 100
    
    net_rx = random.randint(100000, 5000000)
    net_tx = random.randint(50000, 2000000)
    
    processes = [
        {"pid": 1001, "name": "nginx", "cpu": round(random.uniform(0.1, 5.0), 1), "mem": round(random.uniform(0.1, 2.0), 1)},
        {"pid": 5432, "name": "postgres", "cpu": round(random.uniform(1.0, 15.0), 1), "mem": round(random.uniform(5.0, 12.0), 1)},
        {"pid": 8000, "name": "python", "cpu": round(random.uniform(5.0, 25.0), 1), "mem": round(random.uniform(2.0, 8.0), 1)},
        {"pid": 1, "name": "systemd", "cpu": round(random.uniform(0.0, 0.5), 1), "mem": round(random.uniform(0.1, 0.3), 1)},
        {"pid": 9999, "name": "redis-server", "cpu": round(random.uniform(0.5, 3.0), 1), "mem": round(random.uniform(1.0, 4.0), 1)}
    ]
    
    # Sort processes by CPU usage descending to simulate top
    processes.sort(key=lambda x: x["cpu"], reverse=True)
    
    return {
        "hostname": HOSTNAME,
        "cpu_percent": round(cpu, 1),
        "ram_percent": round(ram_percent, 1),
        "ram_used_mb": ram_used,
        "ram_total_mb": ram_total,
        "disk_percent": round(disk_percent, 1),
        "disk_used_gb": disk_used,
        "disk_total_gb": disk_total,
        "net_rx_bytes": net_rx,
        "net_tx_bytes": net_tx,
        "processes": json.dumps(processes)
    }

def main():
    token = register_agent()
    if not token:
        logging.error("Exiting due to registration failure.")
        return
        
    headers = {"Authorization": f"Bearer {token}"}
    
    logging.info("Starting to send fake metrics every 5 seconds...")
    try:
        while True:
            metrics = generate_fake_metrics()
            req = requests.post(f"{BASE_URL}/heartbeat", json=metrics, headers=headers)
            if req.status_code == 200:
                logging.info(f"Sent heartbeat -> CPU: {metrics['cpu_percent']}% | RAM: {metrics['ram_percent']}%")
            else:
                logging.error(f"Failed to send heartbeat: {req.status_code} - {req.text}")
                
            time.sleep(5) # Fast 5 second updates for UI testing
    except KeyboardInterrupt:
        logging.info("Stopped fake agent.")

if __name__ == "__main__":
    main()
