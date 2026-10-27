from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_db
from app.models.alert import Alert
from app.models.user import User
from app.schemas.alert import AlertOut, AlertUpdate
from app.services.alert_service import get_alert, list_alerts, update_alert

router = APIRouter(prefix="/api/v1/alerts", tags=["alerts"])


@router.get("", response_model=list[AlertOut])
def get_alerts(
    severity: str | None = Query(default=None),
    status: str | None = Query(default=None),
    source_ip: str | None = Query(default=None),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    alerts = list_alerts(db, severity=severity, status=status, source_ip=source_ip)
    return [AlertOut.model_validate(alert) for alert in alerts]


@router.get("/{alert_id}", response_model=AlertOut)
def get_alert_by_id(alert_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    alert = get_alert(db, alert_id)
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
    return AlertOut.model_validate(alert)


@router.patch("/{alert_id}", response_model=AlertOut)
def update_alert_by_id(alert_id: int, payload: AlertUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    alert = get_alert(db, alert_id)
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
    alert = update_alert(db, alert, payload.status, payload.note)
    return AlertOut.model_validate(alert)
