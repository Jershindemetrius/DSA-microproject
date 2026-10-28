from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.alert import Alert
from app.models.log_entry import LogEntry
from app.dsa.event_correlation import EventCorrelationGraph


def dashboard_summary(session: Session):
    total_log_count = session.query(LogEntry).count()
    failed_login_count = session.query(LogEntry).filter(LogEntry.event_type == "failed_login").count()
    successful_login_count = session.query(LogEntry).filter(LogEntry.event_type == "successful_login").count()
    total_alert_count = session.query(Alert).count()

    alerts_by_severity = {row[0]: row[1] for row in session.query(Alert.severity, func.count(Alert.id)).group_by(Alert.severity).all()}
    alerts_by_status = {row[0]: row[1] for row in session.query(Alert.status, func.count(Alert.id)).group_by(Alert.status).all()}

    most_suspicious_ips = [
        {"ip": row[0], "count": row[1]} for row in session.query(LogEntry.source_ip, func.count(LogEntry.id)).filter(LogEntry.source_ip.is_not(None), LogEntry.event_type == "failed_login").group_by(LogEntry.source_ip).order_by(func.count(LogEntry.id).desc()).limit(5).all()
    ]
    frequently_targeted_usernames = [
        {"username": row[0], "count": row[1]} for row in session.query(LogEntry.username, func.count(LogEntry.id)).filter(LogEntry.username.is_not(None), LogEntry.event_type == "failed_login").group_by(LogEntry.username).order_by(func.count(LogEntry.id).desc()).limit(5).all()
    ]
    event_volume = [
        {"date": row[0].strftime("%Y-%m-%d"), "count": row[1]} for row in session.query(func.date(LogEntry.timestamp), func.count(LogEntry.id)).group_by(func.date(LogEntry.timestamp)).order_by(func.date(LogEntry.timestamp)).limit(7).all()
    ]
    recent_alerts = [
        {
            "id": row.id,
            "title": row.title,
            "severity": row.severity,
            "status": row.status,
            "detected_at": row.detected_at,
            "source_ip": row.source_ip,
            "username": row.username,
            "detection_type": row.detection_type,
            "description": row.description,
        }
        for row in session.query(Alert).order_by(Alert.detected_at.desc()).limit(10).all()
    ]
    rule_statistics = [
        {"name": row[0], "count": row[1]}
        for row in session.query(Alert.detection_type, func.count(Alert.id)).group_by(Alert.detection_type).order_by(func.count(Alert.id).desc()).all()
    ]
    graph = EventCorrelationGraph()
    for source_ip, username in session.query(LogEntry.source_ip, LogEntry.username).filter(
        LogEntry.source_ip.is_not(None), LogEntry.username.is_not(None)
    ).distinct():
        graph.connect(source_ip, username)
    correlated_entities = [
        {"entities": component}
        for component in graph.connected_components()
        if len(component) > 1
    ]

    return {
        "total_log_count": total_log_count,
        "failed_login_count": failed_login_count,
        "successful_login_count": successful_login_count,
        "total_alert_count": total_alert_count,
        "alerts_by_severity": alerts_by_severity,
        "alerts_by_status": alerts_by_status,
        "most_suspicious_ips": most_suspicious_ips,
        "frequently_targeted_usernames": frequently_targeted_usernames,
        "event_volume": event_volume,
        "recent_alerts": recent_alerts,
        "rule_statistics": rule_statistics,
        "correlated_entities": correlated_entities,
    }
