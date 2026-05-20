from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.schemas.auth import AuthResponse, LoginRequest, ProfileResponse, RegisterRequest, UpdateProfileRequest
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
            "created_at": user.created_at,
            "updated_at": user.updated_at,
        }
    )
