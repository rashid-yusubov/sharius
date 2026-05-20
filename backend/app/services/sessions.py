import secrets
import string
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.config import settings
from app.models.models import Contact
from app.models.models import Session as SessionModel
from app.models.models import SessionFile, SessionText


CODE_ALPHABET = string.ascii_uppercase + string.digits


class SessionService:
    def __init__(self, db: Session):
        self.db = db
        self.storage_dir = Path(settings.storage_dir)
        self.storage_dir.mkdir(parents=True, exist_ok=True)

    def create_session(
        self,
        custom_code: str | None = None,
        creator_user_id: str | None = None,
        content: str = "",
    ) -> dict:
        code = self._normalize_code(custom_code) if custom_code else self._generate_unique_code()
        if custom_code and self.get_session_by_code(code):
            raise ValueError("CODE_ALREADY_EXISTS")

        session = SessionModel(
            code=code,
            creator_user_id=creator_user_id,
            creator_token=secrets.token_urlsafe(32),
            expires_at=self._utcnow() + timedelta(minutes=settings.session_ttl_minutes),
        )
        self.db.add(session)
        self.db.flush()

        text = SessionText(session_id=session.id, content=content)
        self.db.add(text)
        self.db.commit()
        self.db.refresh(session)
        return self.serialize_session(session)

    def get_session_by_code(self, code: str) -> SessionModel | None:
        normalized_code = self._normalize_code(code)
        return self.db.query(SessionModel).filter(SessionModel.code == normalized_code).first()

    def update_text(self, session: SessionModel, content: str) -> None:
        if session.text is None:
            session.text = SessionText(session_id=session.id, content=content)
        else:
            session.text.content = content
        session.updated_at = self._utcnow()
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)

    def save_file(self, session: SessionModel, upload_file: UploadFile) -> None:
        filename = upload_file.filename or ""
        extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        if extension not in settings.allowed_file_extensions:
            raise ValueError("FILE_TYPE_NOT_ALLOWED")

        content = upload_file.file.read()
        if len(content) > settings.max_file_size_bytes:
            raise ValueError("FILE_TOO_LARGE")

        stored_name = f"{uuid.uuid4()}.{extension}"
        storage_path = self.storage_dir / stored_name
        storage_path.write_bytes(content)

        record = SessionFile(
            session_id=session.id,
            original_name=filename,
            stored_name=stored_name,
            mime_type=upload_file.content_type or "application/octet-stream",
            extension=extension,
            size_bytes=len(content),
            storage_path=str(storage_path),
        )
        session.files.append(record)
        session.updated_at = self._utcnow()
        self.db.add(record)
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)

    def get_session_file(self, session: SessionModel, file_id: str) -> SessionFile | None:
        for item in session.files:
            if item.id == file_id:
                return item
        return None

    def delete_file(self, session: SessionModel, file_id: str) -> None:
        record = self.get_session_file(session, file_id)
        if record is None:
            raise ValueError("FILE_NOT_FOUND")

        file_path = Path(record.storage_path)
        if file_path.exists():
            file_path.unlink()

        self.db.delete(record)
        session.updated_at = self._utcnow()
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)

    def delete_session(self, session: SessionModel) -> None:
        for record in session.files:
            file_path = Path(record.storage_path)
            if file_path.exists():
                file_path.unlink()

        self.db.delete(session)
        self.db.commit()

    def cleanup_expired_sessions(self) -> int:
        expired_sessions = self.db.query(SessionModel).all()
        deleted_count = 0

        for session in expired_sessions:
            if self.is_expired(session):
                for record in session.files:
                    file_path = Path(record.storage_path)
                    if file_path.exists():
                        file_path.unlink()

                self.db.delete(session)
                deleted_count += 1

        if deleted_count:
            self.db.commit()

        return deleted_count

    def is_expired(self, session: SessionModel) -> bool:
        return self._as_naive_utc(session.expires_at) <= self._utcnow() or not session.is_active

    def can_edit_session(
        self,
        session: SessionModel,
        current_user_id: str | None = None,
        creator_token: str | None = None,
    ) -> bool:
        if creator_token and creator_token == session.creator_token:
            return True
        if current_user_id and session.creator_user_id == current_user_id:
            return True
        return False

    def create_session_for_contact(
        self,
        creator_user_id: str,
        contact_user_id: str,
        custom_code: str | None = None,
        content: str = "",
    ) -> dict:
        contact = (
            self.db.query(Contact)
            .filter(Contact.user_id == creator_user_id, Contact.contact_user_id == contact_user_id)
            .first()
        )
        if contact is None:
            raise ValueError("CONTACT_NOT_FOUND")
        return self.create_session(custom_code=custom_code, creator_user_id=creator_user_id, content=content)

    def serialize_session(self, session: SessionModel) -> dict:
        return {
            "id": session.id,
            "code": session.code,
            "creator_user_id": session.creator_user_id,
            "creator_token": session.creator_token,
            "is_active": session.is_active,
            "created_at": session.created_at,
            "updated_at": session.updated_at,
            "expires_at": session.expires_at,
            "text": {
                "content": session.text.content,
                "updated_at": session.text.updated_at,
            }
            if session.text
            else None,
            "files": [
                {
                    "id": item.id,
                    "original_name": item.original_name,
                    "mime_type": item.mime_type,
                    "extension": item.extension,
                    "size_bytes": item.size_bytes,
                    "created_at": item.created_at,
                }
                for item in session.files
            ],
        }

    def _generate_unique_code(self, length: int = 6) -> str:
        while True:
            code = "".join(secrets.choice(CODE_ALPHABET) for _ in range(length))
            if not self.get_session_by_code(code):
                return code

    @staticmethod
    def _normalize_code(code: str) -> str:
        return code.strip().upper()

    @staticmethod
    def _utcnow() -> datetime:
        return datetime.utcnow()

    @staticmethod
    def _as_naive_utc(value: datetime) -> datetime:
        if value.tzinfo is None:
            return value
        return value.astimezone(timezone.utc).replace(tzinfo=None)
