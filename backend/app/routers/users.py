from fastapi import APIRouter, Depends

from app.core.auth import get_current_user
from app.models.schemas import (
    AuthUser,
    DiscoverUser,
    FeaturedList,
    FeaturedListCreateRequest,
    PrivacySettings,
    ProfileCustomizationRequest,
    ProfileResponse,
)
from app.services.store import (
    create_featured_list,
    delete_featured_list,
    get_privacy_settings,
    get_profile,
    list_discover_users,
    update_privacy_settings,
    update_profile_customization,
)

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=AuthUser)
async def me(current_user: AuthUser = Depends(get_current_user)) -> AuthUser:
    return current_user


@router.get("/profile/me", response_model=ProfileResponse)
async def my_profile(current_user: AuthUser = Depends(get_current_user)) -> ProfileResponse:
    return get_profile(current_user)


@router.get("/profile/{user_id}", response_model=ProfileResponse)
async def view_profile(user_id: str, current_user: AuthUser = Depends(get_current_user)) -> ProfileResponse:
    return get_profile(current_user, user_id)


@router.get("/search", response_model=list[DiscoverUser])
async def search_users(q: str = "", current_user: AuthUser = Depends(get_current_user)) -> list[DiscoverUser]:
    return list_discover_users(current_user, q)


@router.get("/settings/privacy", response_model=PrivacySettings)
async def privacy_settings(current_user: AuthUser = Depends(get_current_user)) -> PrivacySettings:
    return get_privacy_settings(current_user)


@router.put("/settings/privacy", response_model=PrivacySettings)
async def update_privacy(
    payload: PrivacySettings,
    current_user: AuthUser = Depends(get_current_user),
) -> PrivacySettings:
    return update_privacy_settings(current_user, payload)


@router.put("/settings/customization", response_model=AuthUser)
async def update_customization(
    payload: ProfileCustomizationRequest,
    current_user: AuthUser = Depends(get_current_user),
) -> AuthUser:
    return update_profile_customization(current_user, payload)


@router.post("/lists", response_model=FeaturedList)
async def create_list(
    payload: FeaturedListCreateRequest,
    current_user: AuthUser = Depends(get_current_user),
) -> FeaturedList:
    return create_featured_list(current_user, payload)


@router.delete("/lists/{list_id}")
async def delete_list(list_id: str, current_user: AuthUser = Depends(get_current_user)) -> dict[str, str]:
    delete_featured_list(current_user, list_id)
    return {"status": "deleted"}

