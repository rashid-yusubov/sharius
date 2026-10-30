import sys
from pathlib import Path

# Add backend directory to sys.path so backend/app can be imported
BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import asyncio
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database.db import Base, get_db
from app.main import app
from app.config import settings

TEST_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture(autouse=True)
def mock_background_cleanup(monkeypatch):
    """Prevent background session cleanup loop from connecting to PostgreSQL in tests."""
    async def dummy_cleanup_loop():
        try:
            while True:
                await asyncio.sleep(3600)
        except asyncio.CancelledError:
            pass

    monkeypatch.setattr("app.main.run_session_cleanup_loop", dummy_cleanup_loop)
    monkeypatch.setattr("app.background.session_cleanup.run_session_cleanup_loop", dummy_cleanup_loop)


@pytest.fixture(scope="function")
def engine():
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def db_session(engine):
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture(scope="function")
def client(engine, db_session, tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "storage_dir", tmp_path)

    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    monkeypatch.setattr("app.database.db.SessionLocal", TestingSessionLocal)

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
