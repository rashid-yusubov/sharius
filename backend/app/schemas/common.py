from typing import Any

from pydantic import BaseModel


def success_response(data: Any) -> dict[str, Any]:
    return {"success": True, "data": data}


def error_response(code: str) -> dict[str, Any]:
    return {"success": False, "error": {"code": code}}


class EmptySuccessResponse(BaseModel):
    success: bool
    data: dict[str, Any]
