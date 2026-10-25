import json
from fastapi import APIRouter
from backend.app.database import get_db_connection
from backend.app.models import SettingsModel
from backend.app.config import settings as default_config

router = APIRouter(prefix="/api/settings", tags=["Settings"])

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
                    gemini_model="gemini-2.5-flash",
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
                gemini_model=row[3] or "gemini-2.5-flash",
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
