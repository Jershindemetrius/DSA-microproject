from typing import Any

from pydantic import BaseModel, ConfigDict


class DashboardSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    total_log_count: int
    failed_login_count: int
    successful_login_count: int
    alerts_by_severity: dict[str, int]
    alerts_by_status: dict[str, int]
    most_suspicious_ips: list[dict[str, Any]]
    frequently_targeted_usernames: list[dict[str, Any]]
    event_volume: list[dict[str, Any]]
    recent_alerts: list[dict[str, Any]]
    rule_statistics: list[dict[str, Any]]
    correlated_entities: list[dict[str, Any]]
