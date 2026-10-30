import io


def test_session_lifecycle_and_creator_token_protection(client):
    # 1. Create session as guest -> receives creator_token
    create_res = client.post(
        "/sessions",
        json={"content": "Initial text content"},
    )
    assert create_res.status_code == 201
    created_data = create_res.json()["data"]
    code = created_data["code"]
    creator_token = created_data["creator_token"]
    assert creator_token is not None
    assert created_data["text"]["content"] == "Initial text content"

    # 2. Public GET /sessions/{code} by another guest -> creator_token MUST BE None (no leak!)
    public_res = client.get(f"/sessions/{code}")
    assert public_res.status_code == 200
    public_data = public_res.json()["data"]
    assert public_data["code"] == code
    assert public_data["creator_token"] is None

    # 3. Creator GET /sessions/{code} with X-Creator-Token -> creator_token is returned
    creator_get_res = client.get(
        f"/sessions/{code}",
        headers={"X-Creator-Token": creator_token},
    )
    assert creator_get_res.status_code == 200
    assert creator_get_res.json()["data"]["creator_token"] == creator_token

    # 4. Guest updates text
    update_res = client.put(
        f"/sessions/{code}/text",
        json={"content": "Updated shared text"},
    )
    assert update_res.status_code == 200
    assert update_res.json()["data"]["text"]["content"] == "Updated shared text"

    # 5. Delete session WITHOUT creator token -> 403 Forbidden!
    del_forbidden_res = client.delete(f"/sessions/{code}")
    assert del_forbidden_res.status_code == 403

    # 6. Delete session WITH creator token -> 200 Success!
    del_ok_res = client.delete(
        f"/sessions/{code}",
        headers={"X-Creator-Token": creator_token},
    )
    assert del_ok_res.status_code == 200

    # 7. Verify session is gone
    gone_res = client.get(f"/sessions/{code}")
    assert gone_res.status_code == 404


def test_session_file_upload_download_and_security(client):
    create_res = client.post("/sessions", json={})
    code = create_res.json()["data"]["code"]
    creator_token = create_res.json()["data"]["creator_token"]

    # Upload a text file
    file_content = b"Hello, this is a test document."
    upload_res = client.post(
        f"/sessions/{code}/files",
        files={"file": ("test.txt", io.BytesIO(file_content), "text/plain")},
    )
    assert upload_res.status_code == 201
    files_list = upload_res.json()["data"]["files"]
    assert len(files_list) == 1
    file_id = files_list[0]["id"]

    # Download file with safe security headers
    download_res = client.get(f"/sessions/{code}/files/{file_id}?inline=true")
    assert download_res.status_code == 200
    assert download_res.content == file_content
    assert download_res.headers["X-Content-Type-Options"] == "nosniff"
    assert "sandbox" in download_res.headers["Content-Security-Policy"]

    # Delete file
    del_file_res = client.delete(
        f"/sessions/{code}/files/{file_id}",
        headers={"X-Creator-Token": creator_token},
    )
    assert del_file_res.status_code == 200

    # Verify file is deleted
    del_verify_res = client.get(f"/sessions/{code}/files/{file_id}")
    assert del_verify_res.status_code == 404
