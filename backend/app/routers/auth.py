from fastapi import APIRouter

from app.models.schemas import AuthResponse, LoginRequest, SignupRequest
from app.services.store import login_user, signup_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=AuthResponse)
async def signup(payload: SignupRequest) -> AuthResponse:
    return signup_user(payload)


@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest) -> AuthResponse:
    return login_user(payload)

