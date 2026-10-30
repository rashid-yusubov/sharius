def test_contact_requests_and_contacts_flow(client):
    # 1. Register Alice and Bob
    alice_res = client.post(
        "/auth/register",
        json={"login": "alice_contact", "password": "password123", "display_name": "Alice C"},
    )
    alice_token = alice_res.json()["data"]["token"]
    alice_id = alice_res.json()["data"]["user"]["id"]

    bob_res = client.post(
        "/auth/register",
        json={"login": "bob_contact", "password": "password123", "display_name": "Bob C"},
    )
    bob_token = bob_res.json()["data"]["token"]
    bob_id = bob_res.json()["data"]["user"]["id"]

    # 2. Alice searches for Bob
    search_res = client.get(
        "/users/search?query=bob_contact",
        headers={"Authorization": f"Bearer {alice_token}"},
    )
    assert search_res.status_code == 200
    search_data = search_res.json()["data"]
    assert any(u["id"] == bob_id for u in search_data)

    # 3. Alice sends contact request to Bob
    req_res = client.post(
        "/contacts/requests",
        headers={"Authorization": f"Bearer {alice_token}"},
        json={"user_id": bob_id},
    )
    assert req_res.status_code == 201
    request_id = req_res.json()["data"]["request_id"]

    # Duplicate request while pending should fail
    dup_res = client.post(
        "/contacts/requests",
        headers={"Authorization": f"Bearer {alice_token}"},
        json={"user_id": bob_id},
    )
    assert dup_res.status_code == 400

    # 4. Bob checks incoming requests
    incoming_res = client.get(
        "/contacts/requests/incoming",
        headers={"Authorization": f"Bearer {bob_token}"},
    )
    assert incoming_res.status_code == 200
    incoming_data = incoming_res.json()["data"]
    assert len(incoming_data) == 1
    assert incoming_data[0]["id"] == request_id
    assert incoming_data[0]["from_user"]["id"] == alice_id

    # 5. Bob accepts contact request
    accept_res = client.post(
        f"/contacts/requests/{request_id}/accept",
        headers={"Authorization": f"Bearer {bob_token}"},
    )
    assert accept_res.status_code == 200
    assert accept_res.json()["data"]["status"] == "accepted"

    # 6. Both see each other in contacts
    alice_contacts = client.get("/contacts", headers={"Authorization": f"Bearer {alice_token}"}).json()["data"]
    assert any(c["id"] == bob_id for c in alice_contacts)

    bob_contacts = client.get("/contacts", headers={"Authorization": f"Bearer {bob_token}"}).json()["data"]
    assert any(c["id"] == alice_id for c in bob_contacts)

    # 7. Alice creates a session for Bob
    session_for_contact_res = client.post(
        f"/sessions/for-contact/{bob_id}",
        headers={"Authorization": f"Bearer {alice_token}"},
        json={"content": "Direct session for Bob"},
    )
    assert session_for_contact_res.status_code == 201
    assert session_for_contact_res.json()["data"]["text"]["content"] == "Direct session for Bob"

    # 8. Bob deletes contact
    del_res = client.delete(
        f"/contacts/{alice_id}",
        headers={"Authorization": f"Bearer {bob_token}"},
    )
    assert del_res.status_code == 200

    # Verify both no longer have each other in contacts
    alice_contacts_after = client.get("/contacts", headers={"Authorization": f"Bearer {alice_token}"}).json()["data"]
    assert not any(c["id"] == bob_id for c in alice_contacts_after)

    bob_contacts_after = client.get("/contacts", headers={"Authorization": f"Bearer {bob_token}"}).json()["data"]
    assert not any(c["id"] == alice_id for c in bob_contacts_after)

    # 9. Test re-adding after deletion works cleanly without 500 constraint error
    readd_res = client.post(
        "/contacts/requests",
        headers={"Authorization": f"Bearer {alice_token}"},
        json={"user_id": bob_id},
    )
    assert readd_res.status_code == 201
