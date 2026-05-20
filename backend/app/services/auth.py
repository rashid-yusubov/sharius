from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.models.models import User


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
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

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
