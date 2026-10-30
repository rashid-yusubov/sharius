def _get_error_code(response) -> str | None:
    data = response.json()
    if isinstance(data, dict):
        if "detail" in data and isinstance(data["detail"], dict):
            return data["detail"].get("error", {}).get("code")
        if "error" in data and isinstance(data["error"], dict):
            return data["error"].get("code")
    return None


def test_register_and_login_success(client):
    # Register
    reg_res = client.post(
        "/auth/register",
        json={"login": "testuser", "password": "password123", "display_name": "Test User"},
    )
    assert reg_res.status_code == 201
    reg_data = reg_res.json()
    assert reg_data["success"] is True
    assert "token" in reg_data["data"]
    assert reg_data["data"]["user"]["login"] == "testuser"
    assert reg_data["data"]["user"]["display_name"] == "Test User"

    # Login
    login_res = client.post(
        "/auth/login",
        json={"login": "testuser", "password": "password123"},
    )
    assert login_res.status_code == 200
    login_data = login_res.json()
    assert login_data["success"] is True
    assert "token" in login_data["data"]
    assert login_data["data"]["user"]["login"] == "testuser"


def test_register_duplicate_login_fails(client):
    client.post(
        "/auth/register",
        json={"login": "alice", "password": "password123", "display_name": "Alice"},
    )
    res = client.post(
        "/auth/register",
        json={"login": "alice", "password": "otherpassword", "display_name": "Alice Two"},
    )
    assert res.status_code == 400
    assert _get_error_code(res) == "LOGIN_ALREADY_EXISTS"


def test_login_invalid_credentials(client):
    client.post(
        "/auth/register",
        json={"login": "bob", "password": "correctpassword", "display_name": "Bob"},
    )
    res = client.post(
        "/auth/login",
        json={"login": "bob", "password": "wrongpassword"},
    )
    assert res.status_code == 401
    assert _get_error_code(res) == "INVALID_CREDENTIALS"


def test_get_me_profile(client):
    reg_res = client.post(
        "/auth/register",
        json={"login": "charlie", "password": "password123", "display_name": "Charlie"},
    )
    token = reg_res.json()["data"]["token"]

    # Authenticated
    me_res = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["data"]["login"] == "charlie"

    # Unauthorized
    unauth_res = client.get("/auth/me")
    assert unauth_res.status_code == 401


def test_update_profile(client):
    reg_res = client.post(
        "/auth/register",
        json={"login": "dave", "password": "password123", "display_name": "Dave Original"},
    )
    token = reg_res.json()["data"]["token"]

    patch_res = client.patch(
        "/profile",
        headers={"Authorization": f"Bearer {token}"},
        json={"display_name": "Dave Updated"},
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["data"]["display_name"] == "Dave Updated"


def test_change_password(client):
    reg_res = client.post(
        "/auth/register",
        json={"login": "eve", "password": "oldpassword123", "display_name": "Eve"},
    )
    token = reg_res.json()["data"]["token"]

    # Wrong current password
    fail_res = client.post(
        "/profile/change-password",
        headers={"Authorization": f"Bearer {token}"},
        json={"current_password": "wrongpassword", "new_password": "newpassword123"},
    )
    assert fail_res.status_code == 400
    assert _get_error_code(fail_res) == "INVALID_CURRENT_PASSWORD"

    # Success change password
    ok_res = client.post(
        "/profile/change-password",
        headers={"Authorization": f"Bearer {token}"},
        json={"current_password": "oldpassword123", "new_password": "newpassword123"},
    )
    assert ok_res.status_code == 200
    new_token = ok_res.json()["data"]["token"]

    # Verify login with new password
    login_res = client.post(
        "/auth/login",
        json={"login": "eve", "password": "newpassword123"},
    )
    assert login_res.status_code == 200
