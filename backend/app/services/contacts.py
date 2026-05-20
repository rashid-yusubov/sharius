from datetime import datetime

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.models import Contact, ContactRequest, ContactRequestStatus, User, utcnow


class ContactService:
    def __init__(self, db: Session):
        self.db = db

    def search_users(self, current_user_id: str, query: str) -> list[dict]:
        search = f"%{query.strip()}%"
        users = (
            self.db.query(User)
            .filter(User.id != current_user_id)
            .filter(or_(User.login.ilike(search), User.display_name.ilike(search)))
            .order_by(User.login.asc())
            .limit(20)
            .all()
        )
        return [{"id": user.id, "login": user.login, "display_name": user.display_name} for user in users]

    def create_contact_request(self, from_user_id: str, to_user_id: str) -> dict:
        if from_user_id == to_user_id:
            raise ValueError("CANNOT_ADD_SELF")

        target = self.db.query(User).filter(User.id == to_user_id).first()
        if target is None:
            raise ValueError("USER_NOT_FOUND")

        existing_contact = (
            self.db.query(Contact)
            .filter(Contact.user_id == from_user_id, Contact.contact_user_id == to_user_id)
            .first()
        )
        if existing_contact is not None:
            raise ValueError("CONTACT_REQUEST_ALREADY_EXISTS")

        pending_request = (
            self.db.query(ContactRequest)
            .filter(
                ContactRequest.from_user_id == from_user_id,
                ContactRequest.to_user_id == to_user_id,
                ContactRequest.status == ContactRequestStatus.pending,
            )
            .first()
        )
        if pending_request is not None:
            raise ValueError("CONTACT_REQUEST_ALREADY_EXISTS")

        request = ContactRequest(
            from_user_id=from_user_id,
            to_user_id=to_user_id,
            status=ContactRequestStatus.pending,
        )
        self.db.add(request)
        self.db.commit()
        self.db.refresh(request)
        return {"request_id": request.id, "status": request.status.value}

    def get_incoming_requests(self, current_user_id: str) -> list[dict]:
        requests = (
            self.db.query(ContactRequest, User)
            .join(User, User.id == ContactRequest.from_user_id)
            .filter(
                ContactRequest.to_user_id == current_user_id,
                ContactRequest.status == ContactRequestStatus.pending,
            )
            .order_by(ContactRequest.created_at.desc())
            .all()
        )
        return [
            {
                "id": req.id,
                "from_user": {
                    "id": user.id,
                    "login": user.login,
                    "display_name": user.display_name,
                },
                "status": req.status.value,
                "created_at": req.created_at,
            }
            for req, user in requests
        ]

    def resolve_request(self, request_id: str, current_user_id: str, accepted: bool) -> dict:
        request = self.db.query(ContactRequest).filter(ContactRequest.id == request_id).first()
        if request is None:
            raise ValueError("REQUEST_NOT_FOUND")
        if request.to_user_id != current_user_id:
            raise ValueError("FORBIDDEN")
        if request.status != ContactRequestStatus.pending:
            raise ValueError("REQUEST_ALREADY_RESOLVED")

        request.status = ContactRequestStatus.accepted if accepted else ContactRequestStatus.rejected
        request.resolved_at = utcnow()
        self.db.add(request)

        if accepted:
            self._ensure_contact_pair(request.from_user_id, request.to_user_id)

        self.db.commit()
        self.db.refresh(request)
        return {"status": request.status.value}

    def get_contacts(self, current_user_id: str) -> list[dict]:
        contacts = (
            self.db.query(Contact, User)
            .join(User, User.id == Contact.contact_user_id)
            .filter(Contact.user_id == current_user_id)
            .order_by(User.login.asc())
            .all()
        )
        return [
            {
                "id": user.id,
                "login": user.login,
                "display_name": user.display_name,
            }
            for _, user in contacts
        ]

    def delete_contact(self, current_user_id: str, other_user_id: str) -> dict:
        first = (
            self.db.query(Contact)
            .filter(Contact.user_id == current_user_id, Contact.contact_user_id == other_user_id)
            .first()
        )
        second = (
            self.db.query(Contact)
            .filter(Contact.user_id == other_user_id, Contact.contact_user_id == current_user_id)
            .first()
        )
        if first is None and second is None:
            raise ValueError("CONTACT_NOT_FOUND")

        if first is not None:
            self.db.delete(first)
        if second is not None:
            self.db.delete(second)

        self.db.commit()
        return {"status": "deleted"}

    def _ensure_contact_pair(self, first_user_id: str, second_user_id: str) -> None:
        first = (
            self.db.query(Contact)
            .filter(Contact.user_id == first_user_id, Contact.contact_user_id == second_user_id)
            .first()
        )
        second = (
            self.db.query(Contact)
            .filter(Contact.user_id == second_user_id, Contact.contact_user_id == first_user_id)
            .first()
        )
        if first is None:
            self.db.add(Contact(user_id=first_user_id, contact_user_id=second_user_id))
        if second is None:
            self.db.add(Contact(user_id=second_user_id, contact_user_id=first_user_id))
