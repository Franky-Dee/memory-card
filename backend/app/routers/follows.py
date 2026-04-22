from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.auth import get_current_user
from app.models.schemas import AuthUser, DiscoverUser
from app.services.store import follow_user, list_discover_users, unfollow_user

router = APIRouter(prefix="/follows", tags=["follows"])


@router.get("/discover", response_model=list[DiscoverUser])
async def discover(
    current_user: AuthUser = Depends(get_current_user),
    q: str = Query(default="", min_length=0),
) -> list[DiscoverUser]:
    return list_discover_users(current_user, q)


@router.post("/{user_id}", response_model=list[DiscoverUser])
async def create_follow(user_id: str, current_user: AuthUser = Depends(get_current_user)) -> list[DiscoverUser]:
    if user_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot follow yourself.")
    follow_user(current_user, user_id)
    return list_discover_users(current_user)


@router.delete("/{user_id}", response_model=list[DiscoverUser])
async def delete_follow(user_id: str, current_user: AuthUser = Depends(get_current_user)) -> list[DiscoverUser]:
    unfollow_user(current_user, user_id)
    return list_discover_users(current_user)
