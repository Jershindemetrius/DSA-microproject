from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.alert import AlertOut


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
    duplicate_skips: Optional[int] = None
    algorithms: Optional[dict[str, Any]] = None


class AIAnalysisRequest(BaseModel):
    alert_ids: list[int] = Field(min_length=1, max_length=5)


class AIAlertExplanation(BaseModel):
    alert_id: int
    explanation: str = Field(min_length=1, max_length=600)
    evidence_refs: list[str] = Field(max_length=10)


class AIInvestigationSuggestion(BaseModel):
    suggestion: str = Field(min_length=1, max_length=300)
    evidence_refs: list[str] = Field(min_length=1, max_length=10)


class AIInterpretation(BaseModel):
    summary: str = Field(min_length=1, max_length=600)
    summary_evidence_refs: list[str] = Field(min_length=1, max_length=10)
    explanations: list[AIAlertExplanation] = Field(min_length=1, max_length=5)
    investigation_suggestions: list[AIInvestigationSuggestion] = Field(max_length=8)


class AIAnalysisResponse(BaseModel):
    available: bool
    availability_message: Optional[str] = None
    deterministic_findings: list[AlertOut]
    ai_label: str = "AI-generated interpretation; DSA findings remain authoritative."
    ai_summary: Optional[str] = None
    summary_evidence_refs: list[str] = Field(default_factory=list)
    explanations: list[AIAlertExplanation] = Field(default_factory=list)
    investigation_suggestions: list[AIInvestigationSuggestion] = Field(default_factory=list)
