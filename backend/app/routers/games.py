from fastapi import APIRouter, Query

from app.models.schemas import GameSearchResult, SubmitGameRequest
from app.services.store import list_games, submit_custom_game

router = APIRouter(prefix="/games", tags=["games"])


@router.get("/search")
async def search_games(q: str = Query(default="", min_length=0)) -> list[GameSearchResult]:
    return list_games(q)


@router.post("/submit")
async def submit_game(payload: SubmitGameRequest) -> dict:
    return submit_custom_game(payload)

