def test_employee_cannot_create_asset(client, user_token):
    response = client.post(
        "/assets/",
        headers={"Authorization": f"Bearer {user_token}"},
        json={
            "asset_tag": "TEST-01",
            "category_id": 1,
            "status": "Available",
            "condition_status": "New"
        }
    )

    assert response.status_code == 403


def test_manager_access_granted(client, manager_token):
    response = client.get(
        "/assets/",
        headers={"Authorization": f"Bearer {manager_token}"}
    )

    assert response.status_code == 200