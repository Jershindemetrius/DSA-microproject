def test_user_registration_and_me(client):
    response = client.post("/api/v1/auth/register", json={"email": "alice@example.com", "username": "alice", "password": "password123"})
    assert response.status_code == 201
    token_response = client.post("/api/v1/auth/login", json={"username": "alice", "password": "password123"})
    assert token_response.status_code == 200
    token = token_response.json()["access_token"]
    me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["username"] == "alice"


def test_missing_auth_for_protected_routes(client):
    response = client.get("/api/v1/logs")
    assert response.status_code == 401
