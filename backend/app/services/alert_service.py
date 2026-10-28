from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.alert import Alert


def list_alerts(session: Session, owner_id: int, severity: str | None = None, status: str | None = None, source_ip: str | None = None):
    query = session.query(Alert).filter(Alert.owner_id == owner_id)
    if severity:
        query = query.filter(Alert.severity == severity)
    if status:
        query = query.filter(Alert.status == status)
    if source_ip:
        query = query.filter(Alert.source_ip == source_ip)
    return query.order_by(Alert.detected_at.desc()).all()


def get_alert(session: Session, alert_id: int, owner_id: int):
    return session.query(Alert).filter(Alert.id == alert_id, Alert.owner_id == owner_id).first()


def update_alert(session: Session, alert: Alert, status: str, note: str | None = None):
    alert.status = status
    if note:
        alert.description = f"{alert.description}\n\nFollow-up: {note}"
    session.commit()
    return alert


def alert_count_by_severity(session: Session):
    return session.query(Alert.severity, func.count(Alert.id)).group_by(Alert.severity).all()


def alert_count_by_status(session: Session):
    return session.query(Alert.status, func.count(Alert.id)).group_by(Alert.status).all()
