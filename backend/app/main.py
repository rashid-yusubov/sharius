import asyncio
from contextlib import asynccontextmanager
import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth, contacts, health, sessions
from app.background.session_cleanup import run_session_cleanup_loop
from app.config import settings

logger = logging.getLogger("uvicorn.error")


@asynccontextmanager
async def lifespan(_: FastAPI):
    if settings.is_jwt_secret_insecure:
        if os.getenv("ENVIRONMENT") == "production" or os.getenv("ENV") == "production":
            raise RuntimeError("CRITICAL: JWT_SECRET must be set to a secure secret in production!")
        logger.warning("WARNING: Running with default insecure JWT_SECRET.")

    cleanup_task = asyncio.create_task(run_session_cleanup_loop())
    try:
        yield
    finally:
        cleanup_task.cancel()
        try:
            await cleanup_task
        except asyncio.CancelledError:
            pass


app = FastAPI(title="Sharius Backend API", version="0.1.0", lifespan=lifespan)

cors_origins = list(settings.get_cors_origins())
# Match localhost and standard RFC1918 private LAN IPv4 ranges for local device pairing
lan_regex = r"^https?://(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$"

if "*" in cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_origin_regex=lan_regex,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(auth.profile_router)
app.include_router(contacts.users_router)
app.include_router(contacts.contacts_router)
app.include_router(sessions.router)
