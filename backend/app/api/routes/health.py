from fastapi import APIRouter

from app.schemas.common import success_response


router = APIRouter(tags=["health"])


@router.get("/")
def read_root():
    return success_response({"message": "Backend is running"})


@router.get("/health")
def healthcheck():
    return success_response({"status": "ok"})
