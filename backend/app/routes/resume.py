import json
import uuid
from fastapi import APIRouter, HTTPException, Depends
from backend.app.database import get_db_connection
from backend.app.models import Profile, TailorResponse
from backend.app.services.templates import DEFAULT_PRIMARY_RESUME

router = APIRouter(prefix="/api/resumes", tags=["Resumes"])

@router.get("/profile", response_model=Profile)
async def get_user_profile():
    async with get_db_connection() as db:
        async with db.execute("SELECT * FROM profiles WHERE id = 'default_user'") as cursor:
            row = await cursor.fetchone()
            if not row:
                # Initialize default profile
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
