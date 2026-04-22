from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.routers import auth, dashboard, follows, games, library, notifications, reviews, users
from app.services.store import is_mongo_connected

settings = get_settings()

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=settings.api_prefix)
app.include_router(dashboard.router, prefix=settings.api_prefix)
app.include_router(games.router, prefix=settings.api_prefix)
app.include_router(users.router, prefix=settings.api_prefix)
app.include_router(follows.router, prefix=settings.api_prefix)
app.include_router(library.router, prefix=settings.api_prefix)
app.include_router(reviews.router, prefix=settings.api_prefix)
app.include_router(notifications.router, prefix=settings.api_prefix)


@app.get("/health")
async def healthcheck() -> dict[str, str | bool]:
    return {"status": "ok", "demo_mode": settings.demo_mode, "mongo_connected": is_mongo_connected()}

