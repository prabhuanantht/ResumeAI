import os
from pathlib import Path
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv

# Search for .env in current dir, parent dir, or backend dir
env_paths = [
    Path(__file__).resolve().parent.parent / ".env",
    Path(__file__).resolve().parent.parent.parent / ".env",
    Path(".env"),
]
for p in env_paths:
    if p.exists():
        load_dotenv(p)
        break

class Settings(BaseModel):
    PROJECT_NAME: str = "ResumeAI Backend"
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    DB_PATH: str = os.getenv("DB_PATH", os.path.expanduser("~/.gemini/resumebuilder.db"))
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://*.vercel.app"
    ]
    DEFAULT_SYSTEM_PROMPT: str = (
        "You are an elite, top-tier executive resume writer and ATS optimization expert.\n"
        "Your mission is to tailor the candidate's LaTeX resume to perfectly match the provided job description "
        "while maintaining 100% truthfulness and high ATS compliance.\n\n"
        "CRITICAL FORMATTING & STYLE RULES:\n"
        "1. STRICTLY NEVER use em dashes ('—') anywhere. In LaTeX, always use an en dash ('--') for date ranges or simple hyphens ('-').\n"
        "2. Do not use AI clichés or overused filler words like 'spearheaded', 'leverage', 'game-changing', 'synergized', 'tapestry', 'delve'.\n"
        "3. Every bullet point MUST follow the Google X-Y-Z formula: 'Accomplished [X] as measured by [Y], by doing [Z]'. Start with strong past-tense action verbs (Architected, Engineered, Reduced, Accelerated).\n"
        "4. Include quantifiable metrics (%, $, latency, throughput, headcount) wherever present in candidate background.\n"
        "5. Output valid, compilable LaTeX only. Escape special characters properly (\\%, \\&, \\_, \\$, \\#).\n"
        "6. If a critical requirement in the job description is completely missing from the candidate's primary resume, DO NOT invent experience. Instead, flag it in the missing_skills / gap section so the user can be asked directly."
    )

settings = Settings()
