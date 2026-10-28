def test_run_analysis_generates_alerts(client, auth_headers):
    payload = {"logs": [
        {"timestamp": "2025-02-01T10:00:00Z", "source_ip": "198.51.100.7", "username": "carol", "event_type": "failed_login", "severity": "high", "message": "Failed password for carol from 198.51.100.7", "auth_result": "failed"},
        {"timestamp": "2025-02-01T10:00:10Z", "source_ip": "198.51.100.7", "username": "carol", "event_type": "failed_login", "severity": "high", "message": "Failed password for carol from 198.51.100.7", "auth_result": "failed"},
        {"timestamp": "2025-02-01T10:00:20Z", "source_ip": "198.51.100.7", "username": "carol", "event_type": "successful_login", "severity": "info", "message": "Accepted password for carol from 198.51.100.7", "auth_result": "success"},
    ]}
    client.post("/api/v1/logs/batch", json=payload, headers=auth_headers)
    analysis = client.post("/api/v1/analysis/run", json={"failed_attempt_threshold": 2, "sliding_window_seconds": 300, "suspicious_pattern": "password"}, headers=auth_headers)
    assert analysis.status_code == 200
    data = analysis.json()
    assert data["alerts_generated"] >= 1

    alerts = client.get("/api/v1/alerts", headers=auth_headers)
    assert alerts.status_code == 200
    assert len(alerts.json()) >= 1


def test_run_analysis_groups_identityless_security_events(client, auth_headers):
    payload = {"logs": [
        {"timestamp": f"2025-02-02T10:00:0{index}Z", "event_type": "security" if index % 2 else "error", "severity": "medium", "message": f"Security event {index}"}
        for index in range(5)
    ]}
    upload = client.post("/api/v1/logs/batch", json=payload, headers=auth_headers)
    assert upload.status_code == 201
    logs_response = client.get("/api/v1/logs?size=100", headers=auth_headers)
    log_ids = [log["id"] for log in logs_response.json()["items"]]

    response = client.post("/api/v1/analysis/run", json={}, headers=auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert data["alerts_generated"] == 1
    assert len(data["alert_ids"]) == 1
    alert = client.get("/api/v1/alerts", headers=auth_headers).json()[0]
    assert alert["detection_type"] == "malformed_event"
    assert alert["title"] == "Malformed or anomalous events"
    assert "5 security or error event(s)" in alert["description"]
    assert alert["related_log_ids"] == sorted(log_ids)
