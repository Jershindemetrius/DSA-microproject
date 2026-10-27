from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_db
from app.models.detection_rule import DetectionRule
from app.models.user import User
from app.schemas.rule import DetectionRuleCreate, DetectionRuleOut, DetectionRuleUpdate

router = APIRouter(prefix="/api/v1/rules", tags=["rules"])


@router.get("", response_model=list[DetectionRuleOut])
def list_rules(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rules = db.query(DetectionRule).order_by(DetectionRule.id.asc()).all()
    return [DetectionRuleOut.model_validate(rule) for rule in rules]


@router.post("", response_model=DetectionRuleOut, status_code=status.HTTP_201_CREATED)
def create_rule(payload: DetectionRuleCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rule = DetectionRule(**payload.model_dump())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return DetectionRuleOut.model_validate(rule)


@router.patch("/{rule_id}", response_model=DetectionRuleOut)
def update_rule(rule_id: int, payload: DetectionRuleUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rule = db.query(DetectionRule).filter(DetectionRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(rule, field, value)
    db.commit()
    db.refresh(rule)
    return DetectionRuleOut.model_validate(rule)
