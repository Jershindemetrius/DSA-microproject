def test_log_batch_and_list(client, auth_headers):
    payload = {"logs": [
        {"timestamp": "2025-01-02T09:00:00Z", "source_ip": "10.0.0.21", "username": "admin", "event_type": "failed_login", "severity": "high", "message": "Failed password for admin from 10.0.0.21", "auth_result": "failed"},
        {"timestamp": "2025-01-02T09:00:05Z", "source_ip": "10.0.0.21", "username": "admin", "event_type": "successful_login", "severity": "info", "message": "Accepted password for admin from 10.0.0.21", "auth_result": "success"},
    ]}
    response = client.post("/api/v1/logs/batch", json=payload, headers=auth_headers)
    assert response.status_code == 201
    list_response = client.get("/api/v1/logs?source_ip=10.0.0.21", headers=auth_headers)
    assert list_response.status_code == 200
    assert len(list_response.json()) >= 2


def test_upload_plaintext_log(client, auth_headers):
    test_file = "2025-01-02T13:00:00Z sshd[123]: Failed password for alice from 203.0.113.17 port 22 ssh2\n"
    file = {"file": ("demo.log", test_file.encode("utf-8"), "text/plain")}
    response = client.post("/api/v1/logs/upload", files=file, headers=auth_headers)
    assert response.status_code == 201
    json_body = response.json()
    assert json_body["total_valid"] >= 1
