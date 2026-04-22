from fastapi import APIRouter, Depends

from app.core.auth import get_current_user
from app.models.schemas import AuthUser, CommentCreateRequest, ReviewDraft, ReviewDraftUpdateRequest, ReviewHighlight
from app.services.store import (
    comment_on_review,
    delete_review,
    list_review_drafts,
    publish_review_draft,
    react_to_review,
    save_review_draft,
)

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.get("/drafts", response_model=list[ReviewDraft])
async def get_drafts(current_user: AuthUser = Depends(get_current_user)) -> list[ReviewDraft]:
    return list_review_drafts(current_user)


@router.post("/drafts", response_model=ReviewDraft)
async def create_draft(
    payload: ReviewDraftUpdateRequest,
    current_user: AuthUser = Depends(get_current_user),
) -> ReviewDraft:
    return save_review_draft(current_user, None, payload)


@router.put("/drafts/{draft_id}", response_model=ReviewDraft)
async def update_draft(
    draft_id: str,
    payload: ReviewDraftUpdateRequest,
    current_user: AuthUser = Depends(get_current_user),
) -> ReviewDraft:
    return save_review_draft(current_user, draft_id, payload)


@router.post("/drafts/{draft_id}/publish", response_model=ReviewHighlight)
async def publish_draft(draft_id: str, current_user: AuthUser = Depends(get_current_user)) -> ReviewHighlight:
    return publish_review_draft(current_user, draft_id)


@router.delete("/published/{review_id}")
async def remove_review(review_id: str, current_user: AuthUser = Depends(get_current_user)) -> dict[str, str]:
    delete_review(current_user, review_id)
    return {"status": "deleted"}


@router.post("/published/{review_id}/react", response_model=ReviewHighlight)
async def react(review_id: str, current_user: AuthUser = Depends(get_current_user)) -> ReviewHighlight:
    return react_to_review(current_user, review_id)


@router.post("/published/{review_id}/comments", response_model=ReviewHighlight)
async def comment(
    review_id: str,
    payload: CommentCreateRequest,
    current_user: AuthUser = Depends(get_current_user),
) -> ReviewHighlight:
    return comment_on_review(current_user, review_id, payload)
