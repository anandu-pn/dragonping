#!/usr/bin/env python3
"""
Comprehensive test suite for DragonPing features including email alerts.
Tests all major API endpoints and functionality.
"""

import requests
import json
import time
from datetime import datetime
import sys

BASE_URL = "http://localhost:8000"

# ANSI Colors for output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'
BOLD = '\033[1m'

# Test data
TEST_EMAIL = "testuser@example.com"
TEST_PASSWORD = "TestPassword123!@#"
TEST_ADMIN_EMAIL = "admin@example.com"
TEST_ADMIN_PASSWORD = "AdminPassword123!@#"

auth_token = None
admin_token = None

def print_test(title):
    print(f"\n{BLUE}{BOLD}{'='*60}{RESET}")
    print(f"{BLUE}{BOLD}▶ {title}{RESET}")
    print(f"{BLUE}{BOLD}{'='*60}{RESET}")

def print_success(msg):
    print(f"{GREEN}✓ {msg}{RESET}")

def print_error(msg):
    print(f"{RED}✗ {msg}{RESET}")

def print_info(msg):
    print(f"{YELLOW}ℹ {msg}{RESET}")

def print_response(response):
    try:
        print(json.dumps(response.json(), indent=2))
    except:
        print(response.text)

# ============ Auth Tests ============

def test_user_registration():
    print_test("Test 1: User Registration")
    try:
        response = requests.post(
            f"{BASE_URL}/auth/register",
            json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD,
                "is_admin": False
            }
        )
        
        if response.status_code == 201:
            print_success("User registration successful")
            print_response(response)
            return True
        else:
            print_info(f"Status: {response.status_code}")
            print_response(response)
            return response.status_code == 409  # User might already exist
    except Exception as e:
        print_error(f"Registration failed: {e}")
        return False

def test_admin_registration():
    print_test("Test 2: Admin Registration")
    try:
        response = requests.post(
            f"{BASE_URL}/auth/register",
            json={
                "email": TEST_ADMIN_EMAIL,
                "password": TEST_ADMIN_PASSWORD,
                "is_admin": True
            }
        )
        
        if response.status_code == 201:
            print_success("Admin registration successful")
            return True
        else:
            print_info(f"Status: {response.status_code}")
            print_response(response)
            return response.status_code == 409
    except Exception as e:
        print_error(f"Admin registration failed: {e}")
        return False

def test_user_login():
    print_test("Test 3: User Login")
    global auth_token
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            }
        )
        
        if response.status_code == 200:
            auth_token = response.json().get("access_token")
            print_success(f"User login successful")
            print_info(f"Token: {auth_token[:20]}...")
            return True
        else:
            print_error(f"Login failed: {response.status_code}")
            print_response(response)
            return False
    except Exception as e:
        print_error(f"Login failed: {e}")
        return False

def test_admin_login():
    print_test("Test 4: Admin Login")
    global admin_token
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={
                "email": TEST_ADMIN_EMAIL,
                "password": TEST_ADMIN_PASSWORD
            }
        )
        
        if response.status_code == 200:
            admin_token = response.json().get("access_token")
            print_success(f"Admin login successful")
            print_info(f"Token: {admin_token[:20]}...")
            return True
        else:
            print_error(f"Admin login failed: {response.status_code}")
            print_response(response)
            return False
    except Exception as e:
        print_error(f"Admin login failed: {e}")
        return False

# ============ Service Management Tests ============

service_ids = {}

def test_create_website_service():
    print_test("Test 5: Create Website Service")
    global service_ids
    try:
        response = requests.post(
            f"{BASE_URL}/api/services",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "name": "Google Search",
                "url": "https://www.google.com",
                "description": "Test monitoring Google",
                "type": "website",
                "protocol": "https",
                "interval": 30,
                "active": True,
                "is_public": False
            }
        )
        
        if response.status_code == 201:
            service_data = response.json()
            service_ids["google"] = service_data["id"]
            print_success(f"Website service created (ID: {service_data['id']})")
            print_response(response)
            return True
        else:
            print_error(f"Failed: {response.status_code}")
            print_response(response)
            return False
    except Exception as e:
        print_error(f"Failed: {e}")
        return False

def test_create_device_service():
    print_test("Test 6: Create Device Service (ICMP)")
    global service_ids
    try:
        response = requests.post(
            f"{BASE_URL}/api/services",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "name": "Router Gateway",
                "ip_address": "192.168.1.1",
                "description": "Test router monitoring",
                "type": "device",
                "protocol": "icmp",
                "interval": 30,
                "active": True,
                "is_public": False
            }
        )
        
        if response.status_code == 201:
            service_data = response.json()
            service_ids["router"] = service_data["id"]
            print_success(f"Device service created (ID: {service_data['id']})")
            print_response(response)
            return True
        else:
            print_error(f"Failed: {response.status_code}")
            print_response(response)
            return False
    except Exception as e:
        print_error(f"Failed: {e}")
        return False

def test_create_tcp_service():
    print_test("Test 7: Create Device Service (TCP)")
    global service_ids
    try:
        response = requests.post(
            f"{BASE_URL}/api/services",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "name": "SSH Server",
                "ip_address": "192.168.1.100",
                "port": 22,
                "description": "Test SSH server monitoring",
                "type": "device",
                "protocol": "tcp",
                "interval": 60,
                "active": True,
                "is_public": False
            }
        )
        
        if response.status_code == 201:
            service_data = response.json()
            service_ids["ssh"] = service_data["id"]
            print_success(f"TCP service created (ID: {service_data['id']})")
            print_response(response)
            return True
        else:
            print_error(f"Failed: {response.status_code}")
            print_response(response)
            return False
    except Exception as e:
        print_error(f"Failed: {e}")
        return False

def test_list_services():
    print_test("Test 8: List Services")
    try:
        response = requests.get(
            f"{BASE_URL}/api/services",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        if response.status_code == 200:
            services = response.json()
            print_success(f"Listed {len(services)} services")
            for service in services[:5]:
                print_info(f"- {service['name']} ({service['type']}) - Status: {service.get('status', 'N/A')}")
            return True
        else:
            print_error(f"Failed: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Failed: {e}")
        return False

def test_update_service():
    print_test("Test 9: Update Service")
    if "google" not in service_ids:
        print_error("No service to update")
        return False
    
    try:
        response = requests.put(
            f"{BASE_URL}/api/services/{service_ids['google']}",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "name": "Google Search - Updated",
                "interval": 60,
                "description": "Updated description"
            }
        )
        
        if response.status_code == 200:
            print_success("Service updated successfully")
            print_response(response)
            return True
        else:
            print_error(f"Failed: {response.status_code}")
            print_response(response)
            return False
    except Exception as e:
        print_error(f"Failed: {e}")
        return False

# ============ Status & Monitoring Tests ============

def test_get_service_status():
    print_test("Test 10: Get Service Status")
    if "google" not in service_ids:
        print_error("No service to check status")
        return False
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/status/service/{service_ids['google']}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        if response.status_code == 200:
            status_data = response.json()
            print_success("Service status retrieved")
            print_info(f"Status: {status_data.get('status', 'N/A')}")
            print_info(f"Response Time: {status_data.get('response_time', 'N/A')}ms")
            print_response(response)
            return True
        else:
            print_error(f"Failed: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Failed: {e}")
        return False

def test_get_service_logs():
    print_test("Test 11: Get Service Logs")
    if "google" not in service_ids:
        print_error("No service")
        return False
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/status/service/{service_ids['google']}/logs",
            headers={"Authorization": f"Bearer {admin_token}"},
            params={"limit": 5}
        )
        
        if response.status_code == 200:
            logs = response.json()
            print_success(f"Retrieved {len(logs)} logs")
            for log in logs[:3]:
                print_info(f"- {log.get('timestamp', 'N/A')}: {log.get('status', 'N/A')}")
            return True
        else:
            print_error(f"Failed: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Failed: {e}")
        return False

def test_get_all_status():
    print_test("Test 12: Get Overall Status")
    try:
        response = requests.get(
            f"{BASE_URL}/api/status/all",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        if response.status_code == 200:
            stats = response.json()
            print_success("Overall stats retrieved")
            print_info(f"Total Services: {stats.get('total_services', 0)}")
            print_info(f"Up: {stats.get('up', 0)}")
            print_info(f"Down: {stats.get('down', 0)}")
            print_response(response)
            return True
        else:
            print_error(f"Failed: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Failed: {e}")
        return False

# ============ Alert Tests ============

def test_create_alert():
    print_test("Test 13: Create Email Alert")
    if "google" not in service_ids:
        print_error("No service for alert")
        return False
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/alerts",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "service_id": service_ids["google"],
                "email": TEST_ADMIN_EMAIL,
                "alert_on": ["down", "slow"],
                "alert_threshold": 2000
            }
        )
        
        if response.status_code == 201:
            alert_data = response.json()
            print_success(f"Alert created (ID: {alert_data.get('id', 'N/A')})")
            print_response(response)
            return True
        else:
            print_error(f"Failed: {response.status_code}")
            print_response(response)
            return False
    except Exception as e:
        print_error(f"Failed: {e}")
        return False

def test_list_alerts():
    print_test("Test 14: List Alerts")
    try:
        response = requests.get(
            f"{BASE_URL}/api/alerts",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        if response.status_code == 200:
            alerts = response.json()
            print_success(f"Retrieved {len(alerts)} alerts")
            for alert in alerts:
                print_info(f"- Service ID: {alert.get('service_id')}, Email: {alert.get('email')}")
            return True
        else:
            print_error(f"Failed: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Failed: {e}")
        return False

def test_trigger_alert():
    print_test("Test 15: Test Alert Trigger (Manual)")
    if "google" not in service_ids:
        print_error("No service")
        return False
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/alerts/test",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "service_id": service_ids["google"],
                "email": TEST_ADMIN_EMAIL,
                "reason": "Service is down"
            }
        )
        
        if response.status_code == 200:
            print_success("Test alert sent successfully")
            print_info("Check your email for test alert message")
            print_response(response)
            return True
        else:
            print_error(f"Failed: {response.status_code}")
            print_response(response)
            return False
    except Exception as e:
        print_error(f"Failed: {e}")
        return False

# ============ Public Status Tests ============

def test_public_status():
    print_test("Test 16: Get Public Status")
    try:
        response = requests.get(f"{BASE_URL}/api/public/status")
        
        if response.status_code == 200:
            status = response.json()
            print_success("Public status retrieved")
            print_info(f"Active Services: {len(status.get('services', []))}")
            return True
        else:
            print_error(f"Failed: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Failed: {e}")
        return False

# ============ Main Test Runner ============

def run_all_tests():
    print(f"\n{BOLD}{BLUE}╔════════════════════════════════════════════════════╗{RESET}")
    print(f"{BOLD}{BLUE}║   DragonPing - Comprehensive Feature Test Suite    ║{RESET}")
    print(f"{BOLD}{BLUE}║   Testing Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}          ║{RESET}")
    print(f"{BOLD}{BLUE}╚════════════════════════════════════════════════════╝{RESET}\n")
    
    results = {}
    
    # Auth Tests
    print_info("Starting Authentication Tests...")
    time.sleep(1)
    # Skip registration since admin already exists
    # results["User Registration"] = test_user_registration()
    # time.sleep(0.5)
    # results["Admin Registration"] = test_admin_registration()
    # time.sleep(0.5)
    results["User Login"] = test_user_login()
    time.sleep(0.5)
    results["Admin Login"] = test_admin_login()
    
    if not admin_token:
        print_error("\n⚠️  Admin token not available. Skipping remaining tests.")
        return results
    
    time.sleep(1)
    
    # Service Tests
    print_info("\nStarting Service Management Tests...")
    time.sleep(1)
    results["Create Website Service"] = test_create_website_service()
    time.sleep(0.5)
    results["Create Device Service (ICMP)"] = test_create_device_service()
    time.sleep(0.5)
    results["Create Device Service (TCP)"] = test_create_tcp_service()
    time.sleep(0.5)
    results["List Services"] = test_list_services()
    time.sleep(0.5)
    results["Update Service"] = test_update_service()
    
    time.sleep(1)
    
    # Status & Monitoring Tests
    print_info("\nStarting Status & Monitoring Tests...")
    time.sleep(1)
    results["Get Service Status"] = test_get_service_status()
    time.sleep(0.5)
    results["Get Service Logs"] = test_get_service_logs()
    time.sleep(0.5)
    results["Get Overall Status"] = test_get_all_status()
    
    time.sleep(1)
    
    # Alert Tests
    print_info("\nStarting Alert Tests (Email Feature)...")
    time.sleep(1)
    results["Create Email Alert"] = test_create_alert()
    time.sleep(0.5)
    results["List Alerts"] = test_list_alerts()
    time.sleep(0.5)
    results["Trigger Test Alert"] = test_trigger_alert()
    
    time.sleep(1)
    
    # Public Status
    print_info("\nStarting Public API Tests...")
    time.sleep(1)
    results["Public Status"] = test_public_status()
    
    # Print Summary
    print_summary(results)
    
    return results

def print_summary(results):
    print(f"\n{BLUE}{BOLD}{'='*60}{RESET}")
    print(f"{BLUE}{BOLD}TEST SUMMARY{RESET}")
    print(f"{BLUE}{BOLD}{'='*60}{RESET}\n")
    
    passed = sum(1 for v in results.values() if v)
    failed = len(results) - passed
    
    for test_name, result in results.items():
        status = f"{GREEN}✓ PASS{RESET}" if result else f"{RED}✗ FAIL{RESET}"
        print(f"{status} - {test_name}")
    
    print(f"\n{BOLD}Total: {len(results)} | {GREEN}Passed: {passed}{RESET} | {RED}Failed: {failed}{RESET}\n")
    
    if failed == 0:
        print(f"{GREEN}{BOLD}🎉 All tests passed!{RESET}\n")
    else:
        print(f"{RED}{BOLD}⚠️  {failed} test(s) failed. Check the output above.{RESET}\n")

if __name__ == "__main__":
    try:
        run_all_tests()
    except KeyboardInterrupt:
        print(f"\n{YELLOW}Tests interrupted by user{RESET}")
        sys.exit(1)
    except Exception as e:
        print_error(f"Unexpected error: {e}")
        sys.exit(1)
