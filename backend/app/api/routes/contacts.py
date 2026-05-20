from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies.auth import get_current_user
from app.database.db import get_db
from app.schemas.common import error_response, success_response
from app.schemas.contacts import (
    ContactListResponse,
    ContactRequestActionResponse,
    ContactRequestCreate,
    ContactRequestListResponse,
    ContactRequestResponse,
    UserSearchResponse,
)
from app.services.contacts import ContactService


users_router = APIRouter(prefix="/users", tags=["users"])
contacts_router = APIRouter(prefix="/contacts", tags=["contacts"])


@users_router.get("/search", response_model=UserSearchResponse)
def search_users(
    query: str = Query(..., min_length=1, max_length=100),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ContactService(db)
    users = service.search_users(current_user.id, query)
    return success_response(users)


@contacts_router.post("/requests", response_model=ContactRequestResponse, status_code=status.HTTP_201_CREATED)
def create_contact_request(
    payload: ContactRequestCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ContactService(db)
    try:
        result = service.create_contact_request(current_user.id, payload.user_id)
    except ValueError as exc:
        code = str(exc)
        status_code = status.HTTP_404_NOT_FOUND if code == "USER_NOT_FOUND" else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=error_response(code)) from exc
    return success_response(result)


@contacts_router.get("/requests/incoming", response_model=ContactRequestListResponse)
def get_incoming_contact_requests(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    service = ContactService(db)
    items = service.get_incoming_requests(current_user.id)
    return success_response(items)


@contacts_router.post("/requests/{request_id}/accept", response_model=ContactRequestActionResponse)
def accept_contact_request(
    request_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ContactService(db)
    try:
        result = service.resolve_request(request_id, current_user.id, accepted=True)
    except ValueError as exc:
        code = str(exc)
        status_code = status.HTTP_403_FORBIDDEN if code == "FORBIDDEN" else status.HTTP_404_NOT_FOUND
        if code == "REQUEST_ALREADY_RESOLVED":
            status_code = status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=error_response(code)) from exc
    return success_response(result)


@contacts_router.post("/requests/{request_id}/reject", response_model=ContactRequestActionResponse)
def reject_contact_request(
    request_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ContactService(db)
    try:
        result = service.resolve_request(request_id, current_user.id, accepted=False)
    except ValueError as exc:
        code = str(exc)
        status_code = status.HTTP_403_FORBIDDEN if code == "FORBIDDEN" else status.HTTP_404_NOT_FOUND
        if code == "REQUEST_ALREADY_RESOLVED":
            status_code = status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=error_response(code)) from exc
    return success_response(result)


@contacts_router.get("", response_model=ContactListResponse)
def get_contacts(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    service = ContactService(db)
    items = service.get_contacts(current_user.id)
    return success_response(items)


@contacts_router.delete("/{user_id}", response_model=ContactRequestActionResponse)
def delete_contact(user_id: str, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    service = ContactService(db)
    try:
        result = service.delete_contact(current_user.id, user_id)
    except ValueError as exc:
        code = str(exc)
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=error_response(code)) from exc
    return success_response(result)
