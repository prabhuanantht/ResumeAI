from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/auth", tags=["Auth"])

class LocalStatusResponse(BaseModel):
    mode: str = "local_first"
    local_storage: bool = True
    account_required: bool = False

@router.get("/status", response_model=LocalStatusResponse)
async def auth_status():
    return LocalStatusResponse()

@router.get("/me")
async def current_user():
    return {
        "id": "local_user",
        "mode": "local_storage",
        "description": "Zero account needed. Stored 100% locally."
    }
