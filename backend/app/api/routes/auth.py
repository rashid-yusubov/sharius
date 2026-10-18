import mimetypes
from pathlib import Path
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse, Response
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


def _find_avatar_file(filename: str) -> Path | None:
    if not filename or "/" in filename or "\\" in filename or ".." in filename:
        return None

    clean_filename = filename.split("?")[0].split("#")[0].strip()
    if not clean_filename:
        return None

    candidate_dirs = [
        Path(settings.storage_dir) / "avatars",
        Path("/app/storage/avatars"),
        Path(__file__).resolve().parent.parent.parent / "storage" / "avatars",
    ]

    for cdir in candidate_dirs:
        try:
            resolved_cdir = cdir.resolve()
            resolved_cdir.mkdir(parents=True, exist_ok=True)
            target = (resolved_cdir / clean_filename).resolve()
            try:
                target.relative_to(resolved_cdir)
            except ValueError:
                continue

            if target.exists() and target.is_file():
                return target

            matches = [f for f in resolved_cdir.glob(f"{clean_filename}*") if f.is_file()]
            if matches:
                return matches[0]
        except Exception:
            continue

    return None


@profile_router.get("/avatar")
def get_my_avatar(current_user=Depends(get_current_user)):
    if not current_user.avatar_url:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=error_response("NO_AVATAR"))
    filename = current_user.avatar_url.replace("/profile/avatar/", "").strip()
    return get_avatar(filename)


@profile_router.get("/avatar/{filename}")
def get_avatar(filename: str):
    file_path = _find_avatar_file(filename)
    if not file_path:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=error_response("FILE_NOT_FOUND"))

    ext = file_path.suffix.lower()
    media_map = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".webp": "image/webp",
        ".gif": "image/gif",
        ".svg": "image/svg+xml",
    }
    media_type = media_map.get(ext)
    if not media_type:
        media_type, _ = mimetypes.guess_type(str(file_path))
    if not media_type:
        media_type = "image/png"

    try:
        content = file_path.read_bytes()
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=error_response("READ_FAILED")) from exc

    return Response(
        content=content,
        media_type=media_type,
        headers={
            "Cache-Control": "public, max-age=86400, stale-while-revalidate=86400",
            "Content-Type": media_type,
        },
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

