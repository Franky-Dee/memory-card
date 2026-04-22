from fastapi import APIRouter, Depends

from app.core.auth import get_current_user
from app.models.schemas import AuthUser, NotificationItem
from app.services.store import list_notifications

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationItem])
async def get_notifications(current_user: AuthUser = Depends(get_current_user)) -> list[NotificationItem]:
    return list_notifications(current_user)
