from fastapi import APIRouter, Depends

from app.core.auth import get_current_user
from app.models.schemas import AuthUser, CommentCreateRequest, DashboardResponse, FeedItem, ReactionCreateRequest, ReviewHighlight
from app.services.store import comment_on_feed, get_dashboard, get_profile, react_to_feed

router = APIRouter(tags=["dashboard"])


@router.get("/dashboard", response_model=DashboardResponse)
async def dashboard(current_user: AuthUser = Depends(get_current_user)) -> DashboardResponse:
    return get_dashboard(current_user)


@router.get("/reviews/highlights", response_model=list[ReviewHighlight])
async def review_highlights(current_user: AuthUser = Depends(get_current_user)) -> list[ReviewHighlight]:
    return get_profile(current_user).review_highlights


@router.post("/feed/{feed_id}/react", response_model=FeedItem)
async def react(
    feed_id: str,
    payload: ReactionCreateRequest,
    current_user: AuthUser = Depends(get_current_user),
) -> FeedItem:
    return react_to_feed(current_user, feed_id, payload)


@router.post("/feed/{feed_id}/comments", response_model=FeedItem)
async def comment(
    feed_id: str,
    payload: CommentCreateRequest,
    current_user: AuthUser = Depends(get_current_user),
) -> FeedItem:
    return comment_on_feed(current_user, feed_id, payload)

