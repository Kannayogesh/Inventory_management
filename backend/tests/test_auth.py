def test_register_success(client):
    response = client.post("/auth/register", json={
        "name": "Test User",
        "email": "test@test.com",
        "password": "password",
        "role": "Employee"
    })
    assert response.status_code == 200
    assert "message" in response.json()


def test_login_success(client):
    client.post("/auth/register", json={
        "name": "Login User",
        "email": "login@test.com",
        "password": "password",
        "role": "Employee"
    })

    response = client.post("/auth/login", json={
        "email": "login@test.com",
        "password": "password"
    })

    assert response.status_code == 200
    assert "access_token" in response.json()


def test_login_invalid_password(client):
    client.post("/auth/register", json={
        "name": "Wrong Pass",
        "email": "wrong@test.com",
        "password": "password",
        "role": "Employee"
    })

    response = client.post("/auth/login", json={
        "email": "wrong@test.com",
        "password": "wrongpass"
    })

    assert response.status_code == 401