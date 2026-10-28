from sqlalchemy import create_engine, inspect, text

from app.db.init_db import ensure_owner_columns


def register_account(client, username):
    response = client.post(
        "/api/v1/auth/register",
        json={"email": f"{username}@example.com", "username": username, "password": "secretpass123"},
    )
    assert response.status_code == 201
    token = client.post(
        "/api/v1/auth/login",
        json={"username": username, "password": "secretpass123"},
    ).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_logs_alerts_and_rules_are_scoped_to_the_authenticated_user(client, auth_headers):
    log_payload = {
        "logs": [{
            "timestamp": "2025-03-01T10:00:00Z",
            "source_ip": "198.51.100.27",
            "username": "alice",
            "event_type": "failed_login",
            "severity": "high",
            "message": "Failed password for alice from 198.51.100.27",
            "auth_result": "failed",
        }]
    }
    first_log_response = client.post("/api/v1/logs/batch", json=log_payload, headers=auth_headers)
    assert first_log_response.status_code == 201

    analysis = client.post(
        "/api/v1/analysis/run",
        json={"failed_attempt_threshold": 1},
        headers=auth_headers,
    )
    assert analysis.status_code == 200
    first_alerts = client.get("/api/v1/alerts", headers=auth_headers).json()
    assert first_alerts
    first_alert_id = first_alerts[0]["id"]

    rule_response = client.post(
        "/api/v1/rules",
        json={
            "name": "First account rule",
            "rule_type": "failed_login",
            "description": "A test rule for the first account",
        },
        headers=auth_headers,
    )
    assert rule_response.status_code == 201
    first_rule_id = rule_response.json()["id"]

    second_headers = register_account(client, "second-user")
    second_account_payload = {
        "logs": [{
            **log_payload["logs"][0],
            "source_ip": "203.0.113.44",
            "message": "Failed password for alice from 203.0.113.44",
        }]
    }
    second_log_response = client.post("/api/v1/logs/batch", json=second_account_payload, headers=second_headers)
    assert second_log_response.status_code == 201

    first_logs = client.get("/api/v1/logs", headers=auth_headers).json()
    second_logs = client.get("/api/v1/logs", headers=second_headers).json()
    assert first_logs["total"] == 1
    assert second_logs["total"] == 1
    assert first_logs["items"][0]["id"] != second_logs["items"][0]["id"]
    first_log_id = first_logs["items"][0]["id"]
    assert client.get(f"/api/v1/logs/{first_log_id}", headers=second_headers).status_code == 404
    assert client.delete(f"/api/v1/logs/{first_log_id}", headers=second_headers).status_code == 404
    second_export = client.get("/api/v1/logs/export.csv", headers=second_headers)
    assert "198.51.100.27" not in second_export.text

    assert client.get("/api/v1/alerts", headers=second_headers).json() == []
    assert client.get(f"/api/v1/alerts/{first_alert_id}", headers=second_headers).status_code == 404
    assert client.patch(
        f"/api/v1/alerts/{first_alert_id}",
        json={"status": "resolved"},
        headers=second_headers,
    ).status_code == 404
    assert client.get(f"/api/v1/alerts/{first_alert_id}", headers=auth_headers).json()["status"] == "open"
    assert client.get("/api/v1/rules", headers=second_headers).json() == []
    assert client.patch(
        f"/api/v1/rules/{first_rule_id}",
        json={"enabled": False},
        headers=second_headers,
    ).status_code == 404
    second_rule_response = client.post(
        "/api/v1/rules",
        json={
            "name": "First account rule",
            "rule_type": "failed_login",
            "description": "A test rule for the second account",
        },
        headers=second_headers,
    )
    assert second_rule_response.status_code == 201
    assert client.get("/api/v1/rules", headers=second_headers).json()[0]["id"] != first_rule_id

    first_dashboard = client.get("/api/v1/dashboard/summary", headers=auth_headers).json()
    second_dashboard = client.get("/api/v1/dashboard/summary", headers=second_headers).json()
    first_analysis_summary = client.get("/api/v1/analysis/summary", headers=auth_headers).json()
    second_analysis_summary = client.get("/api/v1/analysis/summary", headers=second_headers).json()
    assert first_dashboard["total_log_count"] == 1
    assert second_dashboard["total_log_count"] == 1
    assert first_dashboard["total_alert_count"] > 0
    assert second_dashboard["total_alert_count"] == 0
    assert first_analysis_summary["suspicious_ips"] == ["198.51.100.27"]
    assert first_analysis_summary["alerts_generated"] == first_dashboard["total_alert_count"]
    assert second_analysis_summary["suspicious_ips"] == ["203.0.113.44"]


def test_owner_migration_leaves_existing_records_unowned():
    legacy_engine = create_engine("sqlite://")
    with legacy_engine.begin() as connection:
        connection.execute(text("CREATE TABLE users (id INTEGER PRIMARY KEY)"))
        connection.execute(text("CREATE TABLE log_entries (id INTEGER PRIMARY KEY)"))
        connection.execute(text("CREATE TABLE alerts (id INTEGER PRIMARY KEY)"))
        connection.execute(text("CREATE TABLE detection_rules (id INTEGER PRIMARY KEY, name TEXT NOT NULL)"))
        connection.execute(text("CREATE UNIQUE INDEX ix_detection_rules_name ON detection_rules(name)"))
        connection.execute(text("INSERT INTO log_entries (id) VALUES (1)"))

    ensure_owner_columns(legacy_engine)

    with legacy_engine.connect() as connection:
        owner_id = connection.execute(text("SELECT owner_id FROM log_entries WHERE id = 1")).scalar_one()
    assert owner_id is None
    rule_indexes = inspect(legacy_engine).get_indexes("detection_rules")
    assert not any(index.get("unique") and index.get("column_names") == ["name"] for index in rule_indexes)
    assert any(index.get("unique") and index.get("column_names") == ["owner_id", "name"] for index in rule_indexes)
    legacy_engine.dispose()
