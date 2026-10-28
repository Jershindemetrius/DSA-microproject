import hashlib
import json
from datetime import datetime
from typing import Any, Iterable

from sqlalchemy.orm import Session

from app.models.log_entry import LogEntry


def _dedupe_key(record: dict[str, Any], owner_id: int | None) -> str:
    payload = {
        "owner_id": owner_id,
        "timestamp": record["timestamp"].isoformat() if isinstance(record["timestamp"], datetime) else str(record["timestamp"]),
        "source_ip": record.get("source_ip"),
        "destination_ip": record.get("destination_ip"),
        "username": record.get("username"),
        "event_type": record.get("event_type"),
        "message": record.get("message"),
        "raw_content": record.get("raw_content"),
    }
    digest = hashlib.sha256(json.dumps(payload, sort_keys=True, default=str).encode("utf-8")).hexdigest()
    return digest


def ingest_log_records(session: Session, records: Iterable[dict[str, Any]], owner_id: int | None = None) -> dict[str, int]:
    inserted = 0
    duplicates = 0
    invalid = 0
    for record in records:
        try:
            if not record.get("message"):
                raise ValueError("missing message")
            key = _dedupe_key(record, owner_id)
            existing = (
                session.query(LogEntry)
                .filter(LogEntry.dedupe_key == key, LogEntry.owner_id == owner_id)
                .first()
            )
            if existing:
                duplicates += 1
                continue
            log_entry = LogEntry(
                owner_id=owner_id,
                timestamp=record["timestamp"],
                source_ip=record.get("source_ip"),
                destination_ip=record.get("destination_ip"),
                username=record.get("username"),
                event_type=str(record.get("event_type") or "info"),
                severity=str(record.get("severity") or "info"),
                message=str(record.get("message")),
                auth_result=record.get("auth_result"),
                source_host=record.get("source_host"),
                metadata_=record.get("metadata") or {},
                raw_content=str(record.get("raw_content") or json.dumps(record, sort_keys=True, default=str)),
                dedupe_key=key,
            )
            session.add(log_entry)
            inserted += 1
        except Exception:
            invalid += 1
    session.commit()
    return {"inserted": inserted, "duplicates": duplicates, "invalid": invalid}
