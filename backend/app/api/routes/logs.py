from typing import Any

from fastapi import APIRouter, Body, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_db
from app.models.log_entry import LogEntry
from app.models.user import User
from app.schemas.log import LogBatchRequest, LogEntryCreate, LogEntryOut, LogIngestionResult
from app.services.log_ingestion import ingest_log_records
from app.services.log_parser import parse_upload_file

router = APIRouter(prefix="/api/v1/logs", tags=["logs"])


@router.post("", response_model=LogIngestionResult, status_code=status.HTTP_201_CREATED)
def add_log(
    payload: dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if isinstance(payload, dict) and "logs" in payload:
        records = payload["logs"]
    else:
        records = [payload]
    try:
        results = ingest_log_records(db, records)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return LogIngestionResult(
        inserted=results["inserted"],
        duplicates=results["duplicates"],
        rejected=results["invalid"],
        total_valid=results["inserted"],
        errors=[],
    )


@router.post("/batch", response_model=LogIngestionResult, status_code=status.HTTP_201_CREATED)
def batch_logs(payload: LogBatchRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    results = ingest_log_records(db, [entry.model_dump() for entry in payload.logs])
    return LogIngestionResult(
        inserted=results["inserted"],
        duplicates=results["duplicates"],
        rejected=results["invalid"],
        total_valid=results["inserted"],
        errors=[],
    )


@router.post("/upload", response_model=LogIngestionResult, status_code=status.HTTP_201_CREATED)
def upload_logs(file: UploadFile = File(...), db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    records, valid, rejected, errors = parse_upload_file(file)
    result = ingest_log_records(db, records)
    return LogIngestionResult(
        inserted=result["inserted"],
        duplicates=result["duplicates"],
        rejected=rejected + result["invalid"],
        total_valid=valid,
        errors=errors,
    )


@router.get("", response_model=list[LogEntryOut])
def list_logs(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    source_ip: str | None = None,
    username: str | None = None,
    event_type: str | None = None,
    severity: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = db.query(LogEntry)
    if source_ip:
        query = query.filter(LogEntry.source_ip == source_ip)
    if username:
        query = query.filter(LogEntry.username == username)
    if event_type:
        query = query.filter(LogEntry.event_type == event_type)
    if severity:
        query = query.filter(LogEntry.severity == severity)
    if start_date:
        query = query.filter(LogEntry.timestamp >= start_date)
    if end_date:
        query = query.filter(LogEntry.timestamp <= end_date)
    logs = query.order_by(LogEntry.timestamp.desc()).offset((page - 1) * size).limit(size).all()
    response = []
    for item in logs:
        response.append(LogEntryOut.model_validate({
            "id": item.id,
            "timestamp": item.timestamp,
            "source_ip": item.source_ip,
            "destination_ip": item.destination_ip,
            "username": item.username,
            "event_type": item.event_type,
            "severity": item.severity,
            "message": item.message,
            "auth_result": item.auth_result,
            "source_host": item.source_host,
            "metadata": item.metadata_,
            "raw_content": item.raw_content,
            "created_at": item.created_at,
        }))
    return response


@router.get("/{log_id}", response_model=LogEntryOut)
def get_log(log_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    log = db.query(LogEntry).filter(LogEntry.id == log_id).first()
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Log record not found")
    return LogEntryOut.model_validate({
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
        "created_at": log.created_at,
    })


@router.delete("/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_log(log_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    log = db.query(LogEntry).filter(LogEntry.id == log_id).first()
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Log record not found")
    db.delete(log)
    db.commit()
    return None
