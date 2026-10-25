from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/auth", tags=["Auth"])

class GoogleAuthPayload(BaseModel):
    credential: Optional[str] = None
    email: Optional[str] = "alex.mercer@gmail.com"
    name: Optional[str] = "Alex Mercer"
    avatar: Optional[str] = None

@router.post("/google")
async def google_login(payload: GoogleAuthPayload):
    # Support client Google OAuth credential handling or direct authentication
    return {
        "status": "success",
        "user": {
            "id": "default_user",
            "email": payload.email,
            "name": payload.name,
            "avatar": payload.avatar or "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80"
        },
        "token": "bearer_jwt_token_overleaf_builder"
    }

@router.get("/me")
async def current_user():
    return {
        "id": "default_user",
        "email": "alex.mercer@gmail.com",
        "name": "Alex Mercer",
        "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80"
    }
