from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field


class LogEntryCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    timestamp: datetime
    source_ip: Optional[str] = None
    destination_ip: Optional[str] = None
    username: Optional[str] = None
    event_type: str = "info"
    severity: str = "info"
    message: str = Field(min_length=1)
    auth_result: Optional[str] = None
    source_host: Optional[str] = None
    metadata: Optional[dict[str, Any]] = None
    raw_content: Optional[str] = None


class LogEntryOut(LogEntryCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime


class LogBatchRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    logs: list[LogEntryCreate]


class LogQuery(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    page: int = 1
    size: int = 20
    source_ip: Optional[str] = None
    username: Optional[str] = None
    event_type: Optional[str] = None
    severity: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class LogIngestionResult(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    inserted: int
    duplicates: int
    rejected: int
    total_valid: int
    errors: list[str] = []


class LogPage(BaseModel):
    items: list[LogEntryOut]
    total: int
    page: int
    size: int
    pages: int
