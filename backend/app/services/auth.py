from datetime import datetime, timedelta, timezone
from pathlib import Path
import uuid

import bcrypt
from fastapi import UploadFile
import jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.models.models import User, utcnow


class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def register(self, login: str, password: str, display_name: str) -> dict:
        normalized_login = login.strip()
        if self._get_user_by_login(normalized_login) is not None:
            raise ValueError("LOGIN_ALREADY_EXISTS")

        user = User(
            login=normalized_login,
            password_hash=self._hash_password(password),
            display_name=display_name.strip(),
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)

        return {"token": self._create_access_token(user), "user": user}

    def login(self, login: str, password: str) -> dict:
        user = self._get_user_by_login(login.strip())
        if user is None:
            raise ValueError("USER_NOT_FOUND")
        if not self._verify_password(password, user.password_hash):
            raise ValueError("INVALID_CREDENTIALS")
        return {"token": self._create_access_token(user), "user": user}

    def get_user_from_token(self, token: str) -> User | None:
        try:
            payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        except jwt.PyJWTError:
            return None

        user_id = payload.get("sub")
        if not user_id:
            return None
        return self.db.query(User).filter(User.id == user_id).first()

    def update_profile(self, user: User, display_name: str) -> User:
        user.display_name = display_name.strip()
        user.updated_at = utcnow()
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def save_avatar(self, user: User, upload_file: UploadFile) -> User:
        filename = (upload_file.filename or "avatar").lower()
        extension = filename.rsplit(".", 1)[-1] if "." in filename else ""
        allowed_extensions = {"jpg", "jpeg", "png", "webp", "gif"}

        content_type = (upload_file.content_type or "").lower()
        if not (content_type.startswith("image/") or extension in allowed_extensions):
            raise ValueError("INVALID_IMAGE_TYPE")

        if extension not in allowed_extensions:
            mime_map = {
                "image/jpeg": "jpg",
                "image/png": "png",
                "image/webp": "webp",
                "image/gif": "gif",
            }
            extension = mime_map.get(content_type)
            if not extension:
                raise ValueError("INVALID_IMAGE_TYPE")

        content = upload_file.file.read()
        max_avatar_size = 5 * 1024 * 1024  # 5 MB
        if len(content) > max_avatar_size:
            raise ValueError("AVATAR_TOO_LARGE")

        avatars_dir = settings.storage_dir / "avatars"
        avatars_dir.mkdir(parents=True, exist_ok=True)

        if user.avatar_url:
            self._delete_avatar_file(user.avatar_url)

        new_filename = f"{user.id}_{uuid.uuid4().hex[:8]}.{extension}"
        storage_path = avatars_dir / new_filename
        storage_path.write_bytes(content)

        user.avatar_url = f"/profile/avatar/{new_filename}"
        user.updated_at = utcnow()
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def delete_avatar(self, user: User) -> User:
        if user.avatar_url:
            self._delete_avatar_file(user.avatar_url)
            user.avatar_url = None
            user.updated_at = utcnow()
            self.db.add(user)
            self.db.commit()
            self.db.refresh(user)
        return user

    def _delete_avatar_file(self, avatar_url: str) -> None:
        if not avatar_url or not avatar_url.startswith("/profile/avatar/"):
            return
        filename = avatar_url.replace("/profile/avatar/", "").strip()
        if not filename or "/" in filename or "\\" in filename or ".." in filename:
            return
        target = settings.storage_dir / "avatars" / filename
        try:
            if target.exists() and target.is_file():
                target.unlink()
        except OSError:
            pass

    def change_password(self, user: User, current_password: str, new_password: str) -> dict:
        if not self._verify_password(current_password, user.password_hash):
            raise ValueError("INVALID_CURRENT_PASSWORD")
        if current_password == new_password:
            raise ValueError("SAME_PASSWORD")

        user.password_hash = self._hash_password(new_password)
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)

        return {"token": self._create_access_token(user), "user": user}

    def _get_user_by_login(self, login: str) -> User | None:
        return self.db.query(User).filter(User.login == login).first()

    def _create_access_token(self, user: User) -> str:
        now = datetime.now(timezone.utc)
        payload = {
            "sub": user.id,
            "login": user.login,
            "iat": now,
            "exp": now + timedelta(minutes=settings.access_token_ttl_minutes),
        }
        return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)

    @staticmethod
    def _hash_password(password: str) -> str:
        hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=12))
        return hashed.decode("utf-8")

    @staticmethod
    def _verify_password(password: str, password_hash: str) -> bool:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
