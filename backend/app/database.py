import aiosqlite
import os
from backend.app.config import settings

async def init_db():
    db_dir = os.path.dirname(settings.DB_PATH)
    if db_dir and not os.path.exists(db_dir):
        os.makedirs(db_dir, exist_ok=True)

    async with aiosqlite.connect(settings.DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS profiles (
                id TEXT PRIMARY KEY,
                name TEXT,
                email TEXT,
                phone TEXT,
                github TEXT,
                linkedin TEXT,
                website TEXT,
                primary_latex TEXT,
                skills TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS tailored_resumes (
                id TEXT PRIMARY KEY,
                job_title TEXT,
                company TEXT,
                job_description TEXT,
                job_url TEXT,
                tailored_latex TEXT,
                ats_score INTEGER,
                ats_breakdown TEXT,
                matched_keywords TEXT,
                missing_skills TEXT,
                diff_summary TEXT,
                status TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS settings (
                id TEXT PRIMARY KEY,
                system_prompt TEXT,
                forbidden_words TEXT,
                enforce_no_em_dashes INTEGER DEFAULT 1,
                gemini_model TEXT,
                gemini_api_key TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        await db.commit()

def get_db_connection():
    return aiosqlite.connect(settings.DB_PATH)
