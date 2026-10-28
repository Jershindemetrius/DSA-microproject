from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_db
from app.core.config import settings
from app.models.user import User
from app.schemas.log import LogIngestionResult
from app.services.log_ingestion import ingest_log_records
from app.services.log_parser import parse_upload_content

router = APIRouter(prefix="/api/v1/uploads", tags=["uploads"])


@router.post("", response_model=LogIngestionResult)
def upload_logs(file: UploadFile = File(...), db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    content = file.file.read(settings.max_upload_size + 1)
    if len(content) > settings.max_upload_size:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Uploaded file exceeds the configured size limit",
        )
    try:
        records, valid, rejected, errors = parse_upload_content(
            file.filename or "",
            content,
            max_records=settings.max_records_per_upload,
        )
    except (UnicodeDecodeError, ValueError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    result = ingest_log_records(db, records, owner_id=user.id)
    return LogIngestionResult(
        inserted=result["inserted"],
        duplicates=result["duplicates"],
        rejected=rejected + result["invalid"],
        total_valid=valid,
        errors=errors,
    )
