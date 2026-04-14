from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.models.coaching_note import CoachingNote
from app.schemas.notes import NoteCreate, NoteUpdate, NoteRead, NoteList

router = APIRouter(prefix="/api/notes", tags=["notes"])


@router.get("", response_model=NoteList)
async def list_notes(
    user_id: str,
    limit: int = 50,
    session: AsyncSession = Depends(get_session),
):
    query = (
        select(CoachingNote)
        .where(CoachingNote.user_id == user_id)
        .order_by(CoachingNote.created_at.desc())
        .limit(limit)
    )
    result = await session.execute(query)
    notes = result.scalars().all()

    count_query = (
        select(func.count())
        .select_from(CoachingNote)
        .where(CoachingNote.user_id == user_id)
    )
    total = (await session.execute(count_query)).scalar() or 0

    return NoteList(items=[NoteRead.model_validate(n) for n in notes], total=total)


@router.post("", response_model=NoteRead, status_code=201)
async def create_note(
    body: NoteCreate,
    session: AsyncSession = Depends(get_session),
):
    note = CoachingNote(
        user_id=body.user_id,
        content=body.content,
        author=body.author,
    )
    session.add(note)
    await session.commit()
    await session.refresh(note)
    return NoteRead.model_validate(note)


@router.patch("/{note_id}", response_model=NoteRead)
async def update_note(
    note_id: str,
    body: NoteUpdate,
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(CoachingNote).where(CoachingNote.id == note_id))
    note = result.scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    if body.content is not None:
        note.content = body.content
    await session.commit()
    await session.refresh(note)
    return NoteRead.model_validate(note)


@router.delete("/{note_id}", status_code=204)
async def delete_note(
    note_id: str,
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(CoachingNote).where(CoachingNote.id == note_id))
    note = result.scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    await session.delete(note)
    await session.commit()
