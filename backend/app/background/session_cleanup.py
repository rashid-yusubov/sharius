import asyncio
import logging

from app.config import settings
from app.database.db import SessionLocal
from app.services.sessions import SessionService


logger = logging.getLogger(__name__)


async def run_session_cleanup_loop() -> None:
    while True:
        db = SessionLocal()
        try:
            service = SessionService(db)
            deleted_count = service.cleanup_expired_sessions()
            if deleted_count:
                logger.info("Deleted %s expired sessions", deleted_count)
        finally:
            db.close()

        await asyncio.sleep(settings.session_cleanup_interval_seconds)
