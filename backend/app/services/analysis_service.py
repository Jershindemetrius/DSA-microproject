from datetime import datetime
from typing import Any

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.alert import Alert
from app.models.log_entry import LogEntry
from app.services.threat_detector import detect_threats


def run_analysis(session: Session, failed_attempt_threshold: int = 3, sliding_window_seconds: int = 300, suspicious_pattern: str | None = None, owner_id: int | None = None) -> dict[str, Any]:
    logs = (
        session.query(LogEntry)
        .filter(LogEntry.owner_id == owner_id)
        .order_by(LogEntry.timestamp.asc())
        .all()
    )
    normalized_logs = [
        {
            "id": log.id,
            "timestamp": log.timestamp,
            "source_ip": log.source_ip,
            "destination_ip": log.destination_ip,
            "username": log.username,
            "event_type": log.event_type,
            "severity": log.severity,
            "message": log.message,
            "auth_result": log.auth_result,
            "source_host": log.source_host,
            "metadata": log.metadata_,
            "raw_content": log.raw_content,
        }
        for log in logs
    ]
    alerts, algorithms = detect_threats(normalized_logs, failed_attempt_threshold, sliding_window_seconds, suspicious_pattern)
    alert_records = []
    for alert in alerts:
        from app.models.alert import Alert as AlertModel
        alert_model = AlertModel(
            owner_id=owner_id,
            title=alert["title"],
            description=alert["description"],
            severity=alert["severity"],
            confidence=float(alert.get("confidence", 0.0)),
            source_ip=alert.get("source_ip"),
            username=alert.get("username"),
            detection_type=alert["detection_type"],
            rule_name=alert.get("rule_name"),
            status=alert.get("status", "open"),
            related_log_ids=alert.get("related_log_ids"),
            recommended_action=alert.get("recommended_action"),
            detected_at=datetime.utcnow(),
        )
        session.add(alert_model)
        alert_records.append(alert_model)
    session.commit()
    for alert_record in alert_records:
        session.refresh(alert_record)
    return {
        "alerts_generated": len(alerts),
        "alert_ids": [alert.id for alert in alert_records],
        "algorithms": algorithms,
        "failed_attempt_threshold": failed_attempt_threshold,
        "sliding_window_seconds": sliding_window_seconds,
    }


def total_logs(session: Session, owner_id: int) -> int:
    return session.query(LogEntry).filter(LogEntry.owner_id == owner_id).count()


def total_alerts(session: Session, owner_id: int) -> int:
    return session.query(Alert).filter(Alert.owner_id == owner_id).count()


def summary(session: Session, owner_id: int):
    suspicious_ips = [
        row[0]
        for row in session.query(LogEntry.source_ip)
        .filter(
            LogEntry.owner_id == owner_id,
            LogEntry.event_type == "failed_login",
            LogEntry.source_ip.is_not(None),
        )
        .group_by(LogEntry.source_ip)
        .order_by(func.count(LogEntry.id).desc())
        .limit(10)
        .all()
    ]
    suspicious_usernames = [
        row[0]
        for row in session.query(LogEntry.username)
        .filter(
            LogEntry.owner_id == owner_id,
            LogEntry.event_type == "failed_login",
            LogEntry.username.is_not(None),
        )
        .group_by(LogEntry.username)
        .order_by(func.count(LogEntry.id).desc())
        .limit(10)
        .all()
    ]
    return {
        "total_logs": total_logs(session, owner_id),
        "total_alerts": total_alerts(session, owner_id),
        "failed_logins": session.query(LogEntry).filter(LogEntry.owner_id == owner_id, LogEntry.event_type == "failed_login").count(),
        "successful_logins": session.query(LogEntry).filter(LogEntry.owner_id == owner_id, LogEntry.event_type == "successful_login").count(),
        "suspicious_ips": suspicious_ips,
        "suspicious_usernames": suspicious_usernames,
    }
