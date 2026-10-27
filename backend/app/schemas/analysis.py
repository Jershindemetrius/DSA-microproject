from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field


class AnalysisRunRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    failed_attempt_threshold: int = Field(default=3, ge=1)
    sliding_window_seconds: int = Field(default=300, ge=10)
    suspicious_pattern: Optional[str] = None


class AnalysisSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    total_logs: int
    total_alerts: int
    failed_logins: int
    successful_logins: int
    suspicious_ips: list[str]
    suspicious_usernames: list[str]
    alerts_generated: int
    duplicate_skips: int
    algorithms: dict[str, Any]
