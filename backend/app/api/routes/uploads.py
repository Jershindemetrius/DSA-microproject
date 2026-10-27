from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.log import LogIngestionResult
from app.services.log_ingestion import ingest_log_records
from app.services.log_parser import parse_upload_file

router = APIRouter(prefix="/api/v1/uploads", tags=["uploads"])


@router.post("", response_model=LogIngestionResult)
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
