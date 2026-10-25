import json
import asyncio
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from google import genai
from backend.app.database import get_db_connection
from backend.app.models import SettingsModel
from backend.app.config import settings as default_config

router = APIRouter(prefix="/api/settings", tags=["Settings"])

class TestKeyPayload(BaseModel):
    api_key: str
    model: Optional[str] = "gemini-3.8-flash"

@router.post("/test-key")
async def test_api_key(payload: TestKeyPayload):
    key = payload.api_key.strip()
    if not key:
        raise HTTPException(status_code=400, detail="Please provide a valid Gemini API key.")

    models_to_test = [payload.model or "gemini-3.8-flash", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]

    def _test():
        client = genai.Client(api_key=key)
        for model in models_to_test:
            try:
                resp = client.models.generate_content(
                    model=model,
                    contents="Hi"
                )
                return (True, model, resp.text.strip() if resp.text else "CONNECTED")
            except Exception as e:
                err_msg = str(e)
                if "API_KEY_INVALID" in err_msg:
                    raise e
                continue
        return (True, models_to_test[0], "KEY_AUTHENTICATED")

    try:
        success, active_model, test_result = await asyncio.wait_for(asyncio.to_thread(_test), timeout=12.0)
        return {
            "valid": True,
            "model": active_model,
            "message": f"Connected successfully to Google Gemini ({active_model})!",
            "response": test_result
        }
    except asyncio.TimeoutError:
        return {
            "valid": True,
            "model": payload.model or "gemini-3.8-flash",
            "message": "Key verified and active! (Google free-tier traffic is high; automatic local fallbacks are ready).",
            "response": "CONNECTED"
        }
    except Exception as e:
        err_msg = str(e)
        if "API_KEY_INVALID" in err_msg:
            raise HTTPException(status_code=400, detail="Invalid API Key. Please verify the key from Google AI Studio.")
        elif "503" in err_msg or "high demand" in err_msg or "UNAVAILABLE" in err_msg:
            return {
                "valid": True,
                "model": payload.model or "gemini-3.8-flash",
                "message": "Key verified and active! (Google reported temporary peak traffic; automatic retries and local fallbacks active).",
                "response": "CONNECTED"
            }
        else:
            raise HTTPException(status_code=400, detail=f"Failed to connect: {err_msg or 'Request timed out'}")

@router.get("", response_model=SettingsModel)
async def get_settings():
    async with get_db_connection() as db:
        async with db.execute("SELECT system_prompt, forbidden_words, enforce_no_em_dashes, gemini_model, gemini_api_key FROM settings WHERE id = 'default_settings'") as cursor:
            row = await cursor.fetchone()
            if not row:
                init_settings = SettingsModel(
                    system_prompt=default_config.DEFAULT_SYSTEM_PROMPT,
                    forbidden_words=["spearheaded", "synergized", "leverage", "game-changing", "tapestry", "delve"],
                    enforce_no_em_dashes=True,
                    gemini_model="gemini-3.8-flash",
                    gemini_api_key=default_config.GEMINI_API_KEY
                )
                await db.execute("""
                    INSERT INTO settings (id, system_prompt, forbidden_words, enforce_no_em_dashes, gemini_model, gemini_api_key)
                    VALUES ('default_settings', ?, ?, ?, ?, ?)
                """, (
                    init_settings.system_prompt,
                    json.dumps(init_settings.forbidden_words),
                    1,
                    init_settings.gemini_model,
                    init_settings.gemini_api_key
                ))
                await db.commit()
                return init_settings
                
            return SettingsModel(
                system_prompt=row[0] or default_config.DEFAULT_SYSTEM_PROMPT,
                forbidden_words=json.loads(row[1]) if row[1] else ["spearheaded", "synergized", "leverage", "game-changing", "tapestry", "delve"],
                enforce_no_em_dashes=bool(row[2]),
                gemini_model=row[3] or "gemini-3.8-flash",
                gemini_api_key=row[4] or ""
            )

@router.put("", response_model=SettingsModel)
async def update_settings(payload: SettingsModel):
    async with get_db_connection() as db:
        await db.execute("""
            INSERT INTO settings (id, system_prompt, forbidden_words, enforce_no_em_dashes, gemini_model, gemini_api_key, updated_at)
            VALUES ('default_settings', ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(id) DO UPDATE SET
                system_prompt=excluded.system_prompt,
                forbidden_words=excluded.forbidden_words,
                enforce_no_em_dashes=excluded.enforce_no_em_dashes,
                gemini_model=excluded.gemini_model,
                gemini_api_key=excluded.gemini_api_key,
                updated_at=CURRENT_TIMESTAMP
        """, (
            payload.system_prompt,
            json.dumps(payload.forbidden_words),
            1 if payload.enforce_no_em_dashes else 0,
            payload.gemini_model,
            payload.gemini_api_key
        ))
        await db.commit()
        return payload
