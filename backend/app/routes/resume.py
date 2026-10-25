import json
import uuid
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from backend.app.database import get_db_connection
from backend.app.models import Profile, TailorResponse, AtsBreakdown
from backend.app.services.templates import DEFAULT_PRIMARY_RESUME
from backend.app.services.ats_scorer import score_resume_against_job
from backend.app.services.gemini import auto_boost_latex

router = APIRouter(prefix="/api/resumes", tags=["Resumes"])

class ScoreRequest(BaseModel):
    latex_code: str
    job_description: Optional[str] = ""

class AutoBoostRequest(BaseModel):
    latex_code: str
    target_jd: Optional[str] = ""

class AutoBoostResponse(BaseModel):
    updated_latex: str
    explanation: str
    changes: List[str]
    original_score: int
    boosted_score: int
    ats_breakdown: AtsBreakdown

@router.post("/score", response_model=AtsBreakdown)
async def score_resume(req: ScoreRequest):
    async with get_db_connection() as db:
        forbidden_words = ["spearheaded", "synergized", "leverage", "game-changing", "tapestry", "delve"]
        async with db.execute("SELECT forbidden_words FROM settings WHERE id = 'default_settings'") as cursor:
            s_row = await cursor.fetchone()
            if s_row and s_row[0]:
                forbidden_words = json.loads(s_row[0])

    breakdown = score_resume_against_job(
        resume_latex=req.latex_code,
        job_description=req.job_description or "General Software Engineering, Distributed Systems, Cloud Architecture, Full Stack",
        forbidden_words=forbidden_words
    )
    return breakdown

@router.post("/auto-boost", response_model=AutoBoostResponse)
async def auto_boost_resume(req: AutoBoostRequest):
    async with get_db_connection() as db:
        gemini_model = "gemini-3.8-flash"
        gemini_key = ""
        forbidden_words = ["spearheaded", "synergized", "leverage", "game-changing", "tapestry", "delve"]
        async with db.execute("SELECT forbidden_words, gemini_model, gemini_api_key FROM settings WHERE id = 'default_settings'") as cursor:
            s_row = await cursor.fetchone()
            if s_row:
                forbidden_words = json.loads(s_row[0]) if s_row[0] else forbidden_words
                gemini_model = s_row[1] or gemini_model
                gemini_key = s_row[2] or ""

    # Calculate pre-boost score
    initial_breakdown = score_resume_against_job(
        resume_latex=req.latex_code,
        job_description=req.target_jd or "General Software Engineering, Distributed Systems, Cloud Architecture, Full Stack",
        forbidden_words=forbidden_words
    )

    # Perform automated AI boost
    boosted_latex, explanation, changes = await auto_boost_latex(
        current_latex=req.latex_code,
        target_jd=req.target_jd,
        gemini_api_key=gemini_key,
        model_name=gemini_model
    )

    # Calculate post-boost score
    boosted_breakdown = score_resume_against_job(
        resume_latex=boosted_latex,
        job_description=req.target_jd or "General Software Engineering, Distributed Systems, Cloud Architecture, Full Stack",
        forbidden_words=forbidden_words
    )

    return AutoBoostResponse(
        updated_latex=boosted_latex,
        explanation=explanation,
        changes=changes,
        original_score=initial_breakdown.overall_score,
        boosted_score=boosted_breakdown.overall_score,
        ats_breakdown=boosted_breakdown
    )

@router.get("/profile", response_model=Profile)
async def get_user_profile():
    async with get_db_connection() as db:
        async with db.execute("SELECT * FROM profiles WHERE id = 'default_user'") as cursor:
            row = await cursor.fetchone()
            if not row:
                initial_profile = Profile(
                    id="default_user",
                    name="Alex Mercer",
                    email="alex.mercer@gmail.com",
                    phone="+1 (555) 349-2018",
                    github="https://github.com/alexmercer",
                    linkedin="https://linkedin.com/in/alexmercer",
                    website="https://alexmercer.dev",
                    primary_latex=DEFAULT_PRIMARY_RESUME,
                    skills=["Python", "TypeScript", "FastAPI", "Next.js", "Docker", "Kubernetes", "AWS", "SQL"]
                )
                await db.execute("""
                    INSERT INTO profiles (id, name, email, phone, github, linkedin, website, primary_latex, skills)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    initial_profile.id, initial_profile.name, initial_profile.email, initial_profile.phone,
                    initial_profile.github, initial_profile.linkedin, initial_profile.website,
                    initial_profile.primary_latex, json.dumps(initial_profile.skills)
                ))
                await db.commit()
                return initial_profile
            
            return Profile(
                id=row[0],
                name=row[1] or "",
                email=row[2] or "",
                phone=row[3] or "",
                github=row[4] or "",
                linkedin=row[5] or "",
                website=row[6] or "",
                primary_latex=row[7] or DEFAULT_PRIMARY_RESUME,
                skills=json.loads(row[8]) if row[8] else [],
                created_at=row[9],
                updated_at=row[10]
            )

@router.put("/profile", response_model=Profile)
async def update_user_profile(profile: Profile):
    async with get_db_connection() as db:
        await db.execute("""
            INSERT INTO profiles (id, name, email, phone, github, linkedin, website, primary_latex, skills, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(id) DO UPDATE SET
                name=excluded.name,
                email=excluded.email,
                phone=excluded.phone,
                github=excluded.github,
                linkedin=excluded.linkedin,
                website=excluded.website,
                primary_latex=excluded.primary_latex,
                skills=excluded.skills,
                updated_at=CURRENT_TIMESTAMP
        """, (
            profile.id, profile.name, profile.email, profile.phone,
            profile.github, profile.linkedin, profile.website,
            profile.primary_latex, json.dumps(profile.skills)
        ))
        await db.commit()
        return profile

@router.get("/tailored")
async def list_tailored_resumes():
    async with get_db_connection() as db:
        async with db.execute("""
            SELECT id, job_title, company, ats_score, status, created_at
            FROM tailored_resumes ORDER BY created_at DESC
        """) as cursor:
            rows = await cursor.fetchall()
            return [
                {
                    "id": r[0],
                    "job_title": r[1],
                    "company": r[2],
                    "ats_score": r[3],
                    "status": r[4],
                    "created_at": r[5]
                }
                for r in rows
            ]

@router.get("/tailored/{resume_id}")
async def get_tailored_resume(resume_id: str):
    async with get_db_connection() as db:
        async with db.execute("SELECT * FROM tailored_resumes WHERE id = ?", (resume_id,)) as cursor:
            row = await cursor.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Tailored resume not found")
            return {
                "id": row[0],
                "job_title": row[1],
                "company": row[2],
                "job_description": row[3],
                "job_url": row[4],
                "tailored_latex": row[5],
                "ats_score": row[6],
                "ats_breakdown": json.loads(row[7]) if row[7] else {},
                "matched_keywords": json.loads(row[8]) if row[8] else [],
                "missing_skills": json.loads(row[9]) if row[9] else [],
                "diff_summary": json.loads(row[10]) if row[10] else [],
                "status": row[11],
                "created_at": row[12]
            }

@router.delete("/tailored/{resume_id}")
async def delete_tailored_resume(resume_id: str):
    async with get_db_connection() as db:
        await db.execute("DELETE FROM tailored_resumes WHERE id = ?", (resume_id,))
        await db.commit()
        return {"status": "success", "id": resume_id}
