from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class RegisterRequest(BaseModel):
    login: str = Field(min_length=3, max_length=100)
    password: str = Field(min_length=6, max_length=255)
    display_name: str = Field(min_length=1, max_length=255)


class LoginRequest(BaseModel):
    login: str = Field(min_length=3, max_length=100)
    password: str = Field(min_length=6, max_length=255)


class UpdateProfileRequest(BaseModel):
    display_name: str = Field(min_length=1, max_length=255)


class UserItem(BaseModel):
    id: str
    login: str
    display_name: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AuthPayload(BaseModel):
    token: str
    user: UserItem


class AuthResponse(BaseModel):
    success: bool
    data: AuthPayload


class ProfileResponse(BaseModel):
    success: bool
    data: UserItem
