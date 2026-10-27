from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_db
from app.models.alert import Alert
from app.models.log_entry import LogEntry
from app.models.user import User
from app.schemas.analysis import AnalysisRunRequest, AnalysisSummaryResponse
from app.services.analysis_service import run_analysis, summary
from app.dsa.event_correlation import EventCorrelationGraph

router = APIRouter(prefix="/api/v1/analysis", tags=["analysis"])


@router.post("/run", response_model=dict[str, Any])
def run_analysis_route(payload: AnalysisRunRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    result = run_analysis(
        db,
        failed_attempt_threshold=payload.failed_attempt_threshold,
        sliding_window_seconds=payload.sliding_window_seconds,
        suspicious_pattern=payload.suspicious_pattern,
    )
    return result


@router.get("/summary", response_model=AnalysisSummaryResponse)
def analysis_summary(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    values = summary(db)
    return AnalysisSummaryResponse(
        total_logs=values.get("total_logs", 0),
        total_alerts=values.get("total_alerts", 0),
        failed_logins=values.get("failed_logins", 0),
        successful_logins=values.get("successful_logins", 0),
        suspicious_ips=[],
        suspicious_usernames=[],
        alerts_generated=0,
        duplicate_skips=0,
        algorithms={},
    )


@router.get("/top-suspicious-ips")
def top_suspicious_ips(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = db.query(LogEntry.source_ip, LogEntry.event_type, LogEntry.username).filter(LogEntry.source_ip.is_not(None)).all()
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
    for log in db.query(LogEntry).all():
        if log.source_ip and log.username:
            graph.connect(log.source_ip, log.username)
    return {"correlations": graph.connected_components()}
