def test_public_no_auth(client, auth_headers):
    """Public status endpoint should work without auth token."""
    # We need at least one user with a username to hit the endpoint
    r = client.get("/api/public/status/testuser")
    assert r.status_code == 200


def test_public_shows_public_services(client, auth_headers):
    client.post(
        "/api/services",
        json={
            "name": "Public one",
            "type": "website",
            "protocol": "http",
            "url": "http://example.com",
            "is_public": True,
        },
        headers=auth_headers,
    )
    r = client.get("/api/public/status/testuser")
    data = r.json()
    assert any(s["name"] == "Public one" for s in data["services"])


def test_public_hides_private(client, auth_headers):
    client.post(
        "/api/services",
        json={
            "name": "Private one",
            "type": "website",
            "protocol": "http",
            "url": "http://example.com",
            "is_public": False,
        },
        headers=auth_headers,
    )
    r = client.get("/api/public/status/testuser")
    data = r.json()
    assert not any(s["name"] == "Private one" for s in data["services"])
