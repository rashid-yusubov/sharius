import mimetypes
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.config import settings
from app.database.db import get_db
from app.schemas.auth import (
    AuthResponse,
    ChangePasswordRequest,
    LoginRequest,
    ProfileResponse,
    RegisterRequest,
    UpdateProfileRequest,
)
from app.schemas.common import error_response, success_response
from app.services.auth import AuthService
from app.api.dependencies.auth import get_current_user


router = APIRouter(prefix="/auth", tags=["auth"])
profile_router = APIRouter(prefix="/profile", tags=["profile"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    try:
        result = service.register(payload.login, payload.password, payload.display_name)
    except ValueError as exc:
        code = str(exc)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_response(code)) from exc
    return success_response(result)


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    try:
        result = service.login(payload.login, payload.password)
    except ValueError as exc:
        code = str(exc)
        status_code = status.HTTP_401_UNAUTHORIZED if code == "INVALID_CREDENTIALS" else status.HTTP_404_NOT_FOUND
        raise HTTPException(status_code=status_code, detail=error_response(code)) from exc
    return success_response(result)


@router.get("/me", response_model=ProfileResponse)
def me(current_user=Depends(get_current_user)):
    return success_response(
        {
            "id": current_user.id,
            "login": current_user.login,
            "display_name": current_user.display_name,
            "avatar_url": current_user.avatar_url,
            "created_at": current_user.created_at,
            "updated_at": current_user.updated_at,
        }
    )


@profile_router.patch("", response_model=ProfileResponse)
def update_profile(
    payload: UpdateProfileRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AuthService(db)
    user = service.update_profile(current_user, payload.display_name)
    return success_response(
        {
            "id": user.id,
            "login": user.login,
            "display_name": user.display_name,
            "avatar_url": user.avatar_url,
            "created_at": user.created_at,
            "updated_at": user.updated_at,
        }
    )


@profile_router.post("/avatar", response_model=ProfileResponse)
def upload_avatar(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AuthService(db)
    try:
        user = service.save_avatar(current_user, file)
    except ValueError as exc:
        code = str(exc)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_response(code)) from exc
    return success_response(
        {
            "id": user.id,
            "login": user.login,
            "display_name": user.display_name,
            "avatar_url": user.avatar_url,
            "created_at": user.created_at,
            "updated_at": user.updated_at,
        }
    )


@profile_router.delete("/avatar", response_model=ProfileResponse)
def delete_avatar(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AuthService(db)
    user = service.delete_avatar(current_user)
    return success_response(
        {
            "id": user.id,
            "login": user.login,
            "display_name": user.display_name,
            "avatar_url": user.avatar_url,
            "created_at": user.created_at,
            "updated_at": user.updated_at,
        }
    )


@profile_router.get("/avatar/{filename}")
def get_avatar(filename: str):
    if not filename or "/" in filename or "\\" in filename or ".." in filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_response("INVALID_FILENAME"))

    avatars_dir = (Path(settings.storage_dir) / "avatars").resolve()
    avatars_dir.mkdir(parents=True, exist_ok=True)
    file_path = (avatars_dir / filename).resolve()

    try:
        file_path.relative_to(avatars_dir)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=error_response("FORBIDDEN"))

    if not file_path.exists() or not file_path.is_file():
        matches = list(avatars_dir.glob(f"{filename}*"))
        if matches and matches[0].is_file():
            file_path = matches[0]
        else:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=error_response("FILE_NOT_FOUND"))

    media_type, _ = mimetypes.guess_type(str(file_path))
    if not media_type:
        media_type = "application/octet-stream"

    return FileResponse(
        path=str(file_path),
        media_type=media_type,
        content_disposition_type="inline",
        headers={"Cache-Control": "public, max-age=86400"},
    )


@profile_router.post("/change-password", response_model=AuthResponse)
def change_password(
    payload: ChangePasswordRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AuthService(db)
    try:
        result = service.change_password(current_user, payload.current_password, payload.new_password)
    except ValueError as exc:
        code = str(exc)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_response(code)) from exc
    return success_response(result)

