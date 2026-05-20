from fastapi import APIRouter, Depends, Header, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api.dependencies.auth import get_current_user, get_optional_current_user
from app.database.db import get_db
from app.schemas.common import EmptySuccessResponse, error_response, success_response
from app.schemas.sessions import SessionCreateRequest, SessionResponse, SessionTextUpdateRequest
from app.services.sessions import SessionService


router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
def create_session(
    payload: SessionCreateRequest,
    current_user=Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    service = SessionService(db)
    session = service.create_session(
        custom_code=payload.custom_code,
        creator_user_id=current_user.id if current_user else None,
        content=payload.content,
    )
    return success_response(session)


@router.get("/{code}", response_model=SessionResponse)
def get_session(code: str, db: Session = Depends(get_db)):
    service = SessionService(db)
    session = service.get_session_by_code(code)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=error_response("SESSION_NOT_FOUND"))
    if service.is_expired(session):
        raise HTTPException(status_code=status.HTTP_410_GONE, detail=error_response("SESSION_EXPIRED"))
    return success_response(service.serialize_session(session))


@router.put("/{code}/text", response_model=SessionResponse)
def update_session_text(
    code: str,
    payload: SessionTextUpdateRequest,
    x_creator_token: str | None = Header(default=None, alias="X-Creator-Token"),
    current_user=Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    service = SessionService(db)
    session = service.get_session_by_code(code)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=error_response("SESSION_NOT_FOUND"))
    if service.is_expired(session):
        raise HTTPException(status_code=status.HTTP_410_GONE, detail=error_response("SESSION_EXPIRED"))
    current_user_id = current_user.id if current_user else None
    if not service.can_edit_session(session, current_user_id=current_user_id, creator_token=x_creator_token):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=error_response("FORBIDDEN"))
    service.update_text(session, payload.content)
    return success_response(service.serialize_session(session))


@router.post("/{code}/files", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
def upload_session_file(
    code: str,
    file: UploadFile,
    x_creator_token: str | None = Header(default=None, alias="X-Creator-Token"),
    current_user=Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    service = SessionService(db)
    session = service.get_session_by_code(code)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=error_response("SESSION_NOT_FOUND"))
    if service.is_expired(session):
        raise HTTPException(status_code=status.HTTP_410_GONE, detail=error_response("SESSION_EXPIRED"))
    current_user_id = current_user.id if current_user else None
    if not service.can_edit_session(session, current_user_id=current_user_id, creator_token=x_creator_token):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=error_response("FORBIDDEN"))
    try:
        service.save_file(session, file)
    except ValueError as exc:
        code = str(exc)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_response(code)) from exc
    return success_response(service.serialize_session(session))


@router.get("/{code}/files/{file_id}")
def download_session_file(code: str, file_id: str, db: Session = Depends(get_db)):
    service = SessionService(db)
    session = service.get_session_by_code(code)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=error_response("SESSION_NOT_FOUND"))
    if service.is_expired(session):
        raise HTTPException(status_code=status.HTTP_410_GONE, detail=error_response("SESSION_EXPIRED"))

    file_record = service.get_session_file(session, file_id)
    if file_record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=error_response("FILE_NOT_FOUND"))

    return FileResponse(
        path=file_record.storage_path,
        media_type=file_record.mime_type,
        filename=file_record.original_name,
    )


@router.delete("/{code}/files/{file_id}", response_model=EmptySuccessResponse)
def delete_session_file(
    code: str,
    file_id: str,
    x_creator_token: str | None = Header(default=None, alias="X-Creator-Token"),
    current_user=Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    service = SessionService(db)
    session = service.get_session_by_code(code)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=error_response("SESSION_NOT_FOUND"))
    if service.is_expired(session):
        raise HTTPException(status_code=status.HTTP_410_GONE, detail=error_response("SESSION_EXPIRED"))

    current_user_id = current_user.id if current_user else None
    if not service.can_edit_session(session, current_user_id=current_user_id, creator_token=x_creator_token):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=error_response("FORBIDDEN"))

    try:
        service.delete_file(session, file_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=error_response(str(exc))) from exc
    return success_response({})


@router.delete("/{code}", response_model=EmptySuccessResponse)
def delete_session(
    code: str,
    x_creator_token: str | None = Header(default=None, alias="X-Creator-Token"),
    current_user=Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    service = SessionService(db)
    session = service.get_session_by_code(code)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=error_response("SESSION_NOT_FOUND"))
    if service.is_expired(session):
        raise HTTPException(status_code=status.HTTP_410_GONE, detail=error_response("SESSION_EXPIRED"))

    current_user_id = current_user.id if current_user else None
    if not service.can_edit_session(session, current_user_id=current_user_id, creator_token=x_creator_token):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=error_response("FORBIDDEN"))

    service.delete_session(session)
    return success_response({})


@router.post("/for-contact/{user_id}", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
def create_session_for_contact(
    user_id: str,
    payload: SessionCreateRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SessionService(db)
    try:
        session = service.create_session_for_contact(
            creator_user_id=current_user.id,
            contact_user_id=user_id,
            custom_code=payload.custom_code,
            content=payload.content,
        )
    except ValueError as exc:
        code = str(exc)
        status_code = status.HTTP_404_NOT_FOUND if code == "CONTACT_NOT_FOUND" else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=error_response(code)) from exc
    return success_response(session)
