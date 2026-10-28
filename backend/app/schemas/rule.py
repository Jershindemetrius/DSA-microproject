from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class DetectionRuleCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    name: str = Field(min_length=3, max_length=100)
    rule_type: str = Field(min_length=3, max_length=50)
    description: str = Field(min_length=5)
    severity: str = "medium"
    threshold: int = Field(default=3, ge=1)
    window_seconds: int = Field(default=300, ge=10)
    pattern: Optional[str] = None
    enabled: bool = True


class DetectionRuleUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    name: Optional[str] = None
    rule_type: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[str] = None
    threshold: Optional[int] = Field(default=None, ge=1)
    window_seconds: Optional[int] = Field(default=None, ge=10)
    pattern: Optional[str] = None
    enabled: Optional[bool] = None


class DetectionRuleOut(DetectionRuleCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
