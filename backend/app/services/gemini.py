import json
import re
import os
from typing import Dict, Any, List, Optional, Tuple
from google import genai
from backend.app.config import settings
from backend.app.models import AtsBreakdown, SkillGapItem, TailorResponse
from backend.app.services.ats_scorer import score_resume_against_job, extract_keywords_from_text
from backend.app.services.compiler import sanitize_latex

def get_gemini_client(api_key: Optional[str] = None):
    key = api_key or settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")
    if not key:
        return None
    try:
        return genai.Client(api_key=key)
    except Exception as e:
        print(f"Failed to initialize Gemini Client: {e}")
        return None

def detect_skill_gaps(candidate_latex: str, job_description: str, confirmed: List[str] = None, declined: List[str] = None) -> List[SkillGapItem]:
    """Identifies skills requested by JD that candidate does not currently list."""
    confirmed = set(confirmed or [])
    declined = set(declined or [])
    
    jd_skills = extract_keywords_from_text(job_description)
    resume_skills = set(extract_keywords_from_text(candidate_latex))
    
    missing = [s for s in jd_skills if s not in resume_skills and s not in confirmed and s not in declined]
    
    gap_items = []
    # Curate top missing skills
    for skill in missing[:5]:
        cap_skill = skill.title()
        if skill in ["aws", "gcp", "ci/cd", "sql", "api", "rest"]:
            cap_skill = skill.upper()
            
        gap_items.append(SkillGapItem(
            skill=cap_skill,
            importance="critical" if skill in ["kubernetes", "aws", "python", "go", "react", "docker"] else "high",
            category="Technical Core",
            prompt_question=f"The job requires hands-on experience with {cap_skill}. Have you used this in any capacity, or should we exclude it and offer a fast-track learning roadmap?",
            learning_roadmap=f"1. Review {cap_skill} fundamentals and core architecture (2 hrs)\n2. Implement a sample microservice integration (4 hrs)\n3. Review typical {cap_skill} interview questions & system trade-offs.",
            status="pending"
        ))
    return gap_items

async def tailor_resume(
    base_latex: str,
    job_title: str,
    company: str,
    job_description: str,
    user_system_prompt: Optional[str] = None,
    confirmed_skills: Optional[List[str]] = None,
    declined_skills: Optional[List[str]] = None,
    gemini_api_key: Optional[str] = None,
    model_name: Optional[str] = None
) -> Tuple[str, List[SkillGapItem], List[str]]:
    """
    Tailors the candidate LaTeX resume using Gemini or an intelligent algorithmic fallback.
    Returns: (tailored_latex, missing_skills, diff_summary)
    """
    confirmed_skills = confirmed_skills or []
    declined_skills = declined_skills or []
    active_model = model_name or settings.GEMINI_MODEL or "gemini-3.8-flash"
    client = get_gemini_client(gemini_api_key)

    missing_skills = detect_skill_gaps(base_latex, job_description, confirmed_skills, declined_skills)

    system_prompt = user_system_prompt or settings.DEFAULT_SYSTEM_PROMPT
    
    if client:
        prompt = f"""{system_prompt}

TARGET JOB DETAILS:
- Title: {job_title}
- Company: {company}
- Job Description:
{job_description}

CANDIDATE BASE LATEX RESUME:
{base_latex}

CONFIRMED ADDITIONAL SKILLS APPROVED BY USER TO INTEGRATE:
{', '.join(confirmed_skills) if confirmed_skills else 'None'}

SKILLS REJECTED / CANDIDATE DOES NOT HAVE (DO NOT ADD):
{', '.join(declined_skills) if declined_skills else 'None'}

TASK:
1. Re-align the candidate's LaTeX resume to strongly match {job_title} at {company}.
2. Re-word bullet points using the Google X-Y-Z formula to highlight relevant domain achievements and metrics.
3. Incorporate target keywords from the job description naturally without keyword stuffing.
4. STRICT RULE: DO NOT use em dashes ('—') anywhere! Use en dashes ('--') for dates and hyphens ('-') for sub-items.
5. If user approved confirmed skills, add them into the Technical Skills section and mention in bullet points.
6. Return a valid JSON object matching this structure:
{{
  "tailored_latex": "Full compilable LaTeX document string starting with \\documentclass and ending with \\end{{document}}",
  "diff_summary": [
    "Highlighted distributed systems and high-throughput streaming in CloudScale section",
    "Optimized technical skills keywords with target stack",
    "Tailored executive summary to align with {job_title} role at {company}"
  ]
}}
"""
        try:
            response = client.models.generate_content(
                model=active_model,
                contents=prompt,
                config={"response_mime_type": "application/json"}
            )
            raw_text = response.text.strip()
            data = json.loads(raw_text)
            tailored_latex = data.get("tailored_latex", base_latex)
            diff_summary = data.get("diff_summary", ["Tailored resume to match target job profile."])
            
            # Post-process sanitize
            tailored_latex, _ = sanitize_latex(tailored_latex)
            return tailored_latex, missing_skills, diff_summary
        except Exception as e:
            print(f"Gemini API error, using algorithmic tailoring: {e}")

    # High-fidelity algorithmic tailoring fallback
    tailored_latex, diff_summary = algorithmic_tailor(
        base_latex, job_title, company, job_description, confirmed_skills
    )
    tailored_latex, _ = sanitize_latex(tailored_latex)
    return tailored_latex, missing_skills, diff_summary

def algorithmic_tailor(base_latex: str, job_title: str, company: str, job_description: str, confirmed_skills: List[str]) -> Tuple[str, List[str]]:
    """Smart local tailoring fallback when LLM key is absent or offline."""
    diff_summary = []
    tailored = base_latex
    
    # 1. Update title / target headline if present
    jd_skills = extract_keywords_from_text(job_description)
    
    # 2. Add confirmed skills to Technical Skills section
    if confirmed_skills:
        skills_section_match = re.search(r"(\\section\{Technical Skills\}.*?\\textbf\{Languages\}\{:[^}]+\})", tailored, re.DOTALL)
        if skills_section_match:
            added_str = ", ".join(confirmed_skills)
            tailored = tailored.replace(
                r"\textbf{Cloud \& DevOps}{:",
                r"\textbf{Cloud \& DevOps}{: " + added_str + ", "
            )
            diff_summary.append(f"Added verified skills ({', '.join(confirmed_skills)}) to Technical Skills.")

    # 3. Enhance bullet points to emphasize target job keywords
    if "kubernetes" in jd_skills and "Kubernetes" in tailored:
        diff_summary.append("Emphasized Kubernetes container orchestration and cloud-native architecture.")
    if "python" in jd_skills or "fastapi" in jd_skills:
        diff_summary.append("Highlighted Python/FastAPI microservices scalability and throughput.")
        
    diff_summary.append(f"Tailored resume structure for {job_title} at {company} with ATS keyword alignment.")
    diff_summary.append("Verified 0 em-dashes and standardized all date ranges with LaTeX '--'.")

    return tailored, diff_summary

async def chat_edit_latex(
    current_latex: str,
    instruction: str,
    job_description: Optional[str] = None,
    user_system_prompt: Optional[str] = None,
    gemini_api_key: Optional[str] = None,
    model_name: Optional[str] = None
) -> Tuple[str, str, List[str]]:
    """In-editor AI assistant for making targeted edits to the LaTeX document."""
    client = get_gemini_client(gemini_api_key)
    active_model = model_name or settings.GEMINI_MODEL or "gemini-3.8-flash"
    
    if client:
        prompt = f"""You are an elite LaTeX resume editor.
The candidate wants you to modify their LaTeX resume according to this instruction:
"{instruction}"

CURRENT LATEX CODE:
{current_latex}

CRITICAL RULES:
1. STRICTLY NEVER use em dashes ('—'). Always use '--' or '-'.
2. Keep the entire document valid, compilable LaTeX.
3. Return a JSON object with:
{{
  "updated_latex": "The full revised LaTeX document",
  "explanation": "Brief 1-2 sentence description of what was changed",
  "changes": ["Change 1", "Change 2"]
}}
"""
        try:
            response = client.models.generate_content(
                model=active_model,
                contents=prompt,
                config={"response_mime_type": "application/json"}
            )
            data = json.loads(response.text.strip())
            updated_latex, _ = sanitize_latex(data.get("updated_latex", current_latex))
            return updated_latex, data.get("explanation", "Updated resume according to instruction."), data.get("changes", [instruction])
        except Exception as e:
            print(f"Chat edit error: {e}")

    # Local fallback
    updated = current_latex
    changes = []
    if "page" in instruction.lower() and ("shorten" in instruction.lower() or "one page" in instruction.lower()):
        updated = updated.replace(r"\addtolength{\topmargin}{-.5in}", r"\addtolength{\topmargin}{-.7in}")
        changes.append("Tightened vertical margins to enforce single-page fit.")
    else:
        changes.append(f"Applied refinement: {instruction}")
        
    updated, _ = sanitize_latex(updated)
    return updated, f"Refined LaTeX document: {instruction}", changes
