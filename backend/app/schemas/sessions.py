from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class SessionCreateRequest(BaseModel):
    custom_code: str | None = Field(default=None, max_length=32)
    content: str = ""


class SessionTextUpdateRequest(BaseModel):
    content: str


class SessionFileItem(BaseModel):
    id: str
    original_name: str
    mime_type: str
    extension: str
    size_bytes: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SessionTextItem(BaseModel):
    content: str
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SessionPayload(BaseModel):
    id: str
    code: str
    creator_token: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    expires_at: datetime
    text: SessionTextItem | None = None
    files: list[SessionFileItem] = []


class SessionResponse(BaseModel):
    success: bool
    data: SessionPayload
