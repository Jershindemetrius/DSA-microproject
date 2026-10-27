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
