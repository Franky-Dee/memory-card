from fastapi import APIRouter, Depends, Query

from app.core.auth import get_current_user
from app.models.schemas import AuthUser, GameDetailResponse, GameSearchResult, SubmitGameRequest
from app.services.store import get_game_detail, list_games, submit_custom_game

router = APIRouter(prefix="/games", tags=["games"])


@router.get("/search")
async def search_games(q: str = Query(default="", min_length=0)) -> list[GameSearchResult]:
    return list_games(q)


@router.get("/{game_id}", response_model=GameDetailResponse)
async def game_detail(game_id: str, current_user: AuthUser = Depends(get_current_user)) -> GameDetailResponse:
    return get_game_detail(current_user, game_id)


@router.post("/submit")
async def submit_game(payload: SubmitGameRequest) -> dict:
    return submit_custom_game(payload)

