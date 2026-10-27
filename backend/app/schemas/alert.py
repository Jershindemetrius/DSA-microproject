from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class AlertOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    description: str
    severity: str
    confidence: float
    source_ip: Optional[str] = None
    username: Optional[str] = None
    detection_type: str
    rule_name: Optional[str] = None
    status: str
    related_log_ids: Optional[list[int]] = None
    recommended_action: Optional[str] = None
    detected_at: datetime


class AlertUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    status: str
    note: Optional[str] = None
