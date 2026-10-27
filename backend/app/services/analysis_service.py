from datetime import datetime
from typing import Any

from sqlalchemy.orm import Session

from app.models.alert import Alert
from app.models.log_entry import LogEntry
from app.services.threat_detector import detect_threats


def run_analysis(session: Session, failed_attempt_threshold: int = 3, sliding_window_seconds: int = 300, suspicious_pattern: str | None = None) -> dict[str, Any]:
    logs = session.query(LogEntry).order_by(LogEntry.timestamp.asc()).all()
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
    for alert in alerts:
        from app.models.alert import Alert as AlertModel
        alert_model = AlertModel(
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
    session.commit()
    return {
        "alerts_generated": len(alerts),
        "algorithms": algorithms,
        "failed_attempt_threshold": failed_attempt_threshold,
        "sliding_window_seconds": sliding_window_seconds,
    }


def total_logs(session: Session) -> int:
    return session.query(LogEntry).count()


def total_alerts(session: Session) -> int:
    return session.query(Alert).count()


def summary(session: Session):
    return {
        "total_logs": total_logs(session),
        "total_alerts": total_alerts(session),
        "failed_logins": session.query(LogEntry).filter(LogEntry.event_type == "failed_login").count(),
        "successful_logins": session.query(LogEntry).filter(LogEntry.event_type == "successful_login").count(),
    }
