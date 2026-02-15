#!/usr/bin/env python3
"""Test script for DragonPing API endpoints (pytest-friendly).

These tests will attempt to register/login a test user and then call
authenticated endpoints. They are resilient if the user already exists.
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"


def get_token(email: str = "test@dragonping.com", password: str = "TestPass123!"):
    """Helper: register (if needed) and return an access token."""
    # Try to register
    resp = requests.post(f"{BASE_URL}/auth/register", json={"email": email, "password": password})
    if resp.status_code == 201:
        return resp.json().get("access_token")

    # If already exists, try login
    resp = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
    if resp.status_code == 200:
        return resp.json().get("access_token")

    return None


def test_health():
    """Test health endpoint."""
    response = requests.get(f"{BASE_URL}/health")
    assert response.status_code == 200


def test_public_status():
    """Test public status endpoint (no auth)."""
    response = requests.get(f"{BASE_URL}/api/public/status/health")
    assert response.status_code == 200


def test_register():
    """Test user registration (resilient)."""
    token = get_token()
    assert token is not None


def test_login():
    """Test user login."""
    token = get_token()
    assert token is not None


def test_create_service():
    """Test service creation with auth."""
    token = get_token()
    assert token is not None

    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    payload = {
        "name": "Google Search",
        "url": "https://www.google.com",
        "description": "Google Search Engine",
        "type": "website",
        "protocol": "https",
        "interval": 60,
        "active": True,
    }

    response = requests.post(f"{BASE_URL}/api/services", json=payload, headers=headers)
    # Accept 201 created or 409 conflict (already exists)
    assert response.status_code in (201, 409)


def test_list_services():
    """Test listing services."""
    token = get_token()
    assert token is not None
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/api/services?skip=0&limit=10", headers=headers)
    assert response.status_code == 200


if __name__ == "__main__":
    # Allow running as a script
    print("Running endpoint tests as script")
    print(f"Timestamp: {datetime.now().isoformat()}")
    test_health()
    test_public_status()
    test_register()
    test_login()
    test_list_services()
    test_create_service()
    print("Done")
