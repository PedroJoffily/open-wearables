from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, File, Form, UploadFile
from fastapi.responses import FileResponse

from app.database import DbSession
from app.schemas.lab_result import LabResultRead
from app.services import ApiKeyDep
from app.services.lab_result_service import lab_result_service

router = APIRouter()


@router.post(
    "/users/{user_id}/lab-results",
    response_model=LabResultRead,
    status_code=201,
)
async def upload_lab_result(
    user_id: UUID,
    db: DbSession,
    _api_key: ApiKeyDep,
    title: str = Form(..., max_length=255),
    tested_at: datetime = Form(...),
    file: UploadFile = File(...),
) -> LabResultRead:
    """Upload a lab result file (PDF/JPG/PNG) for a user."""
    lab = lab_result_service.upload(db, user_id, title, tested_at, file)
    return LabResultRead.model_validate(lab)


@router.get("/users/{user_id}/lab-results", response_model=list[LabResultRead])
async def list_lab_results(
    user_id: UUID,
    db: DbSession,
    _api_key: ApiKeyDep,
) -> list[LabResultRead]:
    """List lab results for a user (ordered by test date, newest first)."""
    labs = lab_result_service.list_for_user(db, user_id)
    return [LabResultRead.model_validate(l) for l in labs]


@router.get("/users/{user_id}/lab-results/{lab_id}/file")
async def get_lab_result_file(
    user_id: UUID,
    lab_id: UUID,
    db: DbSession,
    _api_key: ApiKeyDep,
) -> FileResponse:
    """Stream the lab result file inline."""
    lab = lab_result_service.get(db, user_id, lab_id)
    file_path = lab_result_service.get_file_path(lab)
    return FileResponse(
        path=str(file_path),
        media_type=lab.content_type,
        filename=lab.original_filename,
        headers={
            "Content-Disposition": f'inline; filename="{lab.original_filename}"',
        },
    )


@router.delete("/users/{user_id}/lab-results/{lab_id}", status_code=204)
async def delete_lab_result(
    user_id: UUID,
    lab_id: UUID,
    db: DbSession,
    _api_key: ApiKeyDep,
) -> None:
    """Delete a lab result (removes file + DB row)."""
    lab_result_service.delete(db, user_id, lab_id)
