import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture
def admin_token(client):
    client.post("/auth/register", json={
        "name": "Admin User",
        "email": "admin@test.com",
        "password": "password",
        "role": "Admin"
    })
    response = client.post("/auth/login", json={
        "email": "admin@test.com",
        "password": "password"
    })
    return response.json()["access_token"]


@pytest.fixture
def manager_token(client):
    client.post("/auth/register", json={
        "name": "Manager User",
        "email": "manager@test.com",
        "password": "password",
        "role": "Asset Manager"
    })
    response = client.post("/auth/login", json={
        "email": "manager@test.com",
        "password": "password"
    })
    return response.json()["access_token"]


@pytest.fixture
def user_token(client):
    client.post("/auth/register", json={
        "name": "Employee User",
        "email": "user@test.com",
        "password": "password",
        "role": "Employee"
    })
    response = client.post("/auth/login", json={
        "email": "user@test.com",
        "password": "password"
    })
    return response.json()["access_token"]