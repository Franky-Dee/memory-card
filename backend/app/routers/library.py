from fastapi import APIRouter, Depends

from app.core.auth import get_current_user
from app.models.schemas import AddLibraryEntryRequest, AuthUser, LibraryEntry, UpdateLibraryEntryRequest
from app.services.store import add_library_entry, list_library, update_library_entry

router = APIRouter(prefix="/library", tags=["library"])


@router.get("", response_model=list[LibraryEntry])
async def get_library(current_user: AuthUser = Depends(get_current_user)) -> list[LibraryEntry]:
    return list_library(current_user)


@router.post("", response_model=LibraryEntry)
async def create_library_entry(
    payload: AddLibraryEntryRequest,
    current_user: AuthUser = Depends(get_current_user),
) -> LibraryEntry:
    return add_library_entry(current_user, payload)


@router.patch("/{entry_id}", response_model=LibraryEntry)
async def patch_library_entry(
    entry_id: str,
    payload: UpdateLibraryEntryRequest,
    current_user: AuthUser = Depends(get_current_user),
) -> LibraryEntry:
    return update_library_entry(current_user, entry_id, payload)

