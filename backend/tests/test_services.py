def test_create_service(client, auth_headers):
    r = client.post(
        "/api/services",
        json={
            "name": "Test site",
            "type": "website",
            "protocol": "https",
            "url": "https://example.com",
            "interval": 30,
        },
        headers=auth_headers,
    )
    assert r.status_code == 201
    assert r.json()["name"] == "Test site"


def test_list_services(client, auth_headers):
    r = client.get("/api/services", headers=auth_headers)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_create_requires_auth(client):
    r = client.post(
        "/api/services",
        json={
            "name": "x",
            "type": "website",
            "protocol": "http",
            "url": "http://x.com",
        },
    )
    assert r.status_code in (401, 403)


def test_delete_service(client, auth_headers):
    create = client.post(
        "/api/services",
        json={
            "name": "Del me",
            "type": "website",
            "protocol": "http",
            "url": "http://x.com",
        },
        headers=auth_headers,
    )
    sid = create.json()["id"]
    r = client.delete(f"/api/services/{sid}", headers=auth_headers)
    assert r.status_code == 204
