from contextlib import asynccontextmanager
import asyncio

from fastapi import FastAPI

from app.api.routes import auth, contacts, health, sessions
from app.background.session_cleanup import run_session_cleanup_loop


@asynccontextmanager
async def lifespan(_: FastAPI):
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
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(auth.profile_router)
app.include_router(contacts.users_router)
app.include_router(contacts.contacts_router)
app.include_router(sessions.router)
