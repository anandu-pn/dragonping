def test_register(client):
    r = client.post(
        "/auth/register",
        json={"username": "user_a", "email": "a@test.com", "password": "pass1234"},
    )
    assert r.status_code == 201


def test_duplicate_register(client):
    client.post(
        "/auth/register",
        json={"username": "user_b", "email": "b@test.com", "password": "pass1234"},
    )
    r = client.post(
        "/auth/register",
        json={"username": "user_b2", "email": "b@test.com", "password": "pass1234"},
    )
    assert r.status_code == 400


def test_login(client):
    client.post(
        "/auth/register",
        json={"username": "user_c", "email": "c@test.com", "password": "pass1234"},
    )
    r = client.post(
        "/auth/login", json={"email": "c@test.com", "password": "pass1234"}
    )
    assert r.status_code == 200
    assert "access_token" in r.json()


def test_login_wrong_password(client):
    client.post(
        "/auth/register",
        json={"username": "user_d", "email": "d@test.com", "password": "pass1234"},
    )
    r = client.post(
        "/auth/login", json={"email": "d@test.com", "password": "wrongpass"}
    )
    assert r.status_code == 401


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"
