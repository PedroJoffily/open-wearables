"""Service for lab result file uploads (PDF/JPG/PNG)."""

from datetime import datetime, timezone
from logging import Logger, getLogger
from pathlib import Path
from uuid import UUID, uuid4

from fastapi import HTTPException, UploadFile
from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.models.lab_result import LabResult

UPLOAD_ROOT = Path("/data/uploads/lab-results")
ALLOWED_CONTENT_TYPES = {
    "application/pdf": ".pdf",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
}
MAX_SIZE_BYTES = 20 * 1024 * 1024  # 20 MB


class LabResultService:
    def __init__(self, log: Logger):
        self.logger = log

    def upload(
        self,
        db: Session,
        user_id: UUID,
        title: str,
        tested_at: datetime,
        file: UploadFile,
    ) -> LabResult:
        content_type = (file.content_type or "").lower()
        if content_type not in ALLOWED_CONTENT_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {content_type}. Allowed: PDF, JPG, PNG.",
            )

        contents = file.file.read()
        size = len(contents)
        if size > MAX_SIZE_BYTES:
            raise HTTPException(
                status_code=400,
                detail=f"File too large ({size} bytes). Max is {MAX_SIZE_BYTES} bytes.",
            )
        if size == 0:
            raise HTTPException(status_code=400, detail="Empty file.")

        extension = ALLOWED_CONTENT_TYPES[content_type]
        lab_id = uuid4()
        filename = f"{lab_id}{extension}"
        user_dir = UPLOAD_ROOT / str(user_id)
        user_dir.mkdir(parents=True, exist_ok=True)
        file_path = user_dir / filename
        file_path.write_bytes(contents)

        relative_key = f"{user_id}/{filename}"

        lab = LabResult(
            id=lab_id,
            user_id=user_id,
            title=title,
            tested_at=tested_at,
            file_key=relative_key,
            original_filename=file.filename or filename,
            content_type=content_type,
            size_bytes=size,
            created_at=datetime.now(timezone.utc),
        )
        db.add(lab)
        db.commit()
        db.refresh(lab)
        return lab

    def list_for_user(self, db: Session, user_id: UUID) -> list[LabResult]:
        stmt = (
            select(LabResult)
            .where(LabResult.user_id == user_id)
            .order_by(LabResult.tested_at.desc())
        )
        return list(db.execute(stmt).scalars().all())

    def get(self, db: Session, user_id: UUID, lab_id: UUID) -> LabResult:
        stmt = select(LabResult).where(
            and_(LabResult.id == lab_id, LabResult.user_id == user_id)
        )
        lab = db.execute(stmt).scalar_one_or_none()
        if not lab:
            raise HTTPException(status_code=404, detail="Lab result not found")
        return lab

    def delete(self, db: Session, user_id: UUID, lab_id: UUID) -> bool:
        lab = self.get(db, user_id, lab_id)
        file_path = self.get_file_path(lab)
        try:
            if file_path.exists():
                file_path.unlink()
        except OSError as e:
            self.logger.warning(f"Failed to delete file {file_path}: {e}")
        db.delete(lab)
        db.commit()
        return True

    def get_file_path(self, lab: LabResult) -> Path:
        return UPLOAD_ROOT / lab.file_key


lab_result_service = LabResultService(log=getLogger(__name__))
