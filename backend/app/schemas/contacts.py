from datetime import datetime

from pydantic import BaseModel, Field


class ContactRequestCreate(BaseModel):
    user_id: str = Field(min_length=36, max_length=36)


class UserSearchItem(BaseModel):
    id: str
    login: str
    display_name: str


class UserSearchResponse(BaseModel):
    success: bool
    data: list[UserSearchItem]


class ContactRequestItem(BaseModel):
    id: str
    from_user: UserSearchItem
    status: str
    created_at: datetime


class ContactRequestCreatedItem(BaseModel):
    request_id: str
    status: str


class ContactRequestResponse(BaseModel):
    success: bool
    data: ContactRequestCreatedItem


class ContactRequestListResponse(BaseModel):
    success: bool
    data: list[ContactRequestItem]


class ContactItem(BaseModel):
    id: str
    login: str
    display_name: str


class ContactListResponse(BaseModel):
    success: bool
    data: list[ContactItem]


class ContactRequestActionItem(BaseModel):
    status: str


class ContactRequestActionResponse(BaseModel):
    success: bool
    data: ContactRequestActionItem
