from fastapi import Header, HTTPException, status

from app.models.schemas import AuthUser
from app.services.store import get_user_by_token


def get_current_user(authorization: str | None = Header(default=None)) -> AuthUser:
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing authorization header.")

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authorization header.")

    user = get_user_by_token(token)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session is not valid.")

    return user

