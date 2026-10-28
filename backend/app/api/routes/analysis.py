from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_db
from app.models.alert import Alert
from app.models.log_entry import LogEntry
from app.models.user import User
from app.schemas.analysis import AIAnalysisRequest, AIAnalysisResponse, AnalysisRunRequest, AnalysisSummaryResponse
from app.services.ai_analysis_service import explain_alerts
from app.services.analysis_service import run_analysis, summary
from app.core.config import settings
from app.dsa.event_correlation import EventCorrelationGraph

router = APIRouter(prefix="/api/v1/analysis", tags=["analysis"])


@router.post("/run", response_model=dict[str, Any])
def run_analysis_route(payload: AnalysisRunRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    result = run_analysis(
        db,
        failed_attempt_threshold=payload.failed_attempt_threshold,
        sliding_window_seconds=payload.sliding_window_seconds,
        suspicious_pattern=payload.suspicious_pattern,
        owner_id=user.id,
    )
    return result


@router.get("/summary", response_model=AnalysisSummaryResponse)
def analysis_summary(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    values = summary(db, user.id)
    return AnalysisSummaryResponse(
        total_logs=values.get("total_logs", 0),
        total_alerts=values.get("total_alerts", 0),
        failed_logins=values.get("failed_logins", 0),
        successful_logins=values.get("successful_logins", 0),
        suspicious_ips=values["suspicious_ips"],
        suspicious_usernames=values["suspicious_usernames"],
        alerts_generated=values["total_alerts"],
    )


@router.post("/explain", response_model=AIAnalysisResponse)
def explain_analysis_route(
    payload: AIAnalysisRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    api_key = settings.gemini_api_key
    try:
        return explain_alerts(
            db,
            owner_id=user.id,
            alert_ids=payload.alert_ids,
            api_key=api_key.get_secret_value() if api_key else None,
            model=settings.gemini_model,
        )
    except LookupError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error)) from error


@router.get("/top-suspicious-ips")
def top_suspicious_ips(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = db.query(LogEntry.source_ip, LogEntry.event_type, LogEntry.username).filter(
        LogEntry.owner_id == user.id,
        LogEntry.source_ip.is_not(None),
    ).all()
    grouped = {}
    for source_ip, event_type, username in rows:
        grouped[source_ip] = grouped.get(source_ip, {"count": 0, "types": set(), "usernames": set()})
        grouped[source_ip]["count"] += 1
        grouped[source_ip]["types"].add(event_type)
        if username:
            grouped[source_ip]["usernames"].add(username)
    items = [{
        "ip": ip,
        "score": data["count"] + len(data["types"]) * 2,
        "types": sorted(data["types"]),
        "usernames": sorted(data["usernames"]),
    } for ip, data in grouped.items()]
    return sorted(items, key=lambda item: item["score"], reverse=True)[:10]


@router.get("/correlations")
def get_correlations(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    graph = EventCorrelationGraph()
    for log in db.query(LogEntry).filter(LogEntry.owner_id == user.id).all():
        if log.source_ip and log.username:
            graph.connect(log.source_ip, log.username)
    return {"correlations": graph.connected_components()}
