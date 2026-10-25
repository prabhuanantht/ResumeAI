import json
import uuid
from fastapi import APIRouter, HTTPException
from backend.app.database import get_db_connection
from backend.app.models import TailorRequest, TailorResponse, ChatEditRequest, ChatEditResponse, SkillGapItem
from backend.app.services.scraper import scrape_job_url
from backend.app.services.gemini import tailor_resume, chat_edit_latex
from backend.app.services.ats_scorer import score_resume_against_job
from backend.app.services.templates import DEFAULT_PRIMARY_RESUME

router = APIRouter(prefix="/api/tailor", tags=["Tailoring"])

@router.post("/scrape")
async def scrape_job(payload: dict):
    url = payload.get("url")
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")
    data = await scrape_job_url(url)
    return data

@router.post("/generate", response_model=TailorResponse)
async def generate_tailored_resume(req: TailorRequest):
    async with get_db_connection() as db:
        # 1. Fetch user base resume if not provided
        base_latex = req.base_latex
        if not base_latex:
            async with db.execute("SELECT primary_latex FROM profiles WHERE id = 'default_user'") as cursor:
                row = await cursor.fetchone()
                base_latex = row[0] if (row and row[0]) else DEFAULT_PRIMARY_RESUME

        # 2. Fetch user settings
        system_prompt = req.user_system_prompt
        gemini_model = "gemini-2.5-flash"
        gemini_key = ""
        forbidden_words = ["spearheaded", "synergized", "leverage", "game-changing", "tapestry", "delve"]
        
        async with db.execute("SELECT system_prompt, forbidden_words, gemini_model, gemini_api_key FROM settings WHERE id = 'default_settings'") as cursor:
            s_row = await cursor.fetchone()
            if s_row:
                if not system_prompt:
                    system_prompt = s_row[0]
                forbidden_words = json.loads(s_row[1]) if s_row[1] else forbidden_words
                gemini_model = s_row[2] or gemini_model
                gemini_key = s_row[3] or ""

        # 3. Call tailor engine
        job_title = req.job_title or "Software Engineer"
        company = req.company or "Target Company"
        job_desc = req.job_description or ""
        
        tailored_latex, missing_skills, diff_summary = await tailor_resume(
            base_latex=base_latex,
            job_title=job_title,
            company=company,
            job_description=job_desc,
            user_system_prompt=system_prompt,
            confirmed_skills=req.confirmed_skills,
            declined_skills=req.declined_skills,
            gemini_api_key=gemini_key,
            model_name=gemini_model
        )

        # 4. Compute ATS breakdown
        ats_breakdown = score_resume_against_job(
            resume_latex=tailored_latex,
            job_description=job_desc,
            forbidden_words=forbidden_words
        )

        resume_id = str(uuid.uuid4())
        status = "needs_clarification" if any(s.status == "pending" for s in missing_skills) else "ready"

        # 5. Save to database
        await db.execute("""
            INSERT INTO tailored_resumes (
                id, job_title, company, job_description, job_url,
                tailored_latex, ats_score, ats_breakdown, matched_keywords,
                missing_skills, diff_summary, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            resume_id, job_title, company, job_desc, req.job_url or "",
            tailored_latex, ats_breakdown.overall_score,
            ats_breakdown.model_dump_json(),
            json.dumps(ats_breakdown.matched_keywords),
            json.dumps([s.model_dump() for s in missing_skills]),
            json.dumps(diff_summary),
            status
        ))
        await db.commit()

        return TailorResponse(
            id=resume_id,
            job_title=job_title,
            company=company,
            tailored_latex=tailored_latex,
            ats_score=ats_breakdown.overall_score,
            ats_breakdown=ats_breakdown,
            matched_keywords=ats_breakdown.matched_keywords,
            missing_skills=missing_skills,
            diff_summary=diff_summary,
            status=status
        )

@router.post("/chat-edit", response_model=ChatEditResponse)
async def chat_edit(req: ChatEditRequest):
    async with get_db_connection() as db:
        gemini_model = "gemini-2.5-flash"
        gemini_key = ""
        async with db.execute("SELECT gemini_model, gemini_api_key FROM settings WHERE id = 'default_settings'") as cursor:
            s_row = await cursor.fetchone()
            if s_row:
                gemini_model = s_row[0] or gemini_model
                gemini_key = s_row[1] or ""

        updated_latex, explanation, changes = await chat_edit_latex(
            current_latex=req.current_latex,
            instruction=req.instruction,
            job_description=req.job_description,
            user_system_prompt=req.user_system_prompt,
            gemini_api_key=gemini_key,
            model_name=gemini_model
        )
        return ChatEditResponse(
            updated_latex=updated_latex,
            explanation=explanation,
            changes=changes
        )
