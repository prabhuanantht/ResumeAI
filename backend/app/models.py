from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class Profile(BaseModel):
    id: str = "default_user"
    name: str = "Alex Mercer"
    email: str = "alex.mercer@gmail.com"
    phone: str = "+1 (555) 349-2018"
    github: str = "https://github.com/alexmercer"
    linkedin: str = "https://linkedin.com/in/alexmercer"
    website: str = "https://alexmercer.dev"
    primary_latex: str = ""
    skills: List[str] = []
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class SkillGapItem(BaseModel):
    skill: str
    importance: str = "high" # "critical", "high", "nice_to_have"
    category: str = "Technical"
    prompt_question: str
    learning_roadmap: str # e.g. "Complete official tutorial (3h), build a demo project (5h)"
    status: str = "pending" # "pending", "confirmed_add", "declined"

class AtsBreakdown(BaseModel):
    overall_score: int
    keyword_match_score: int
    impact_metrics_score: int
    action_verbs_score: int
    formatting_hygiene_score: int
    matched_keywords: List[str]
    missing_keywords: List[str]
    detected_em_dashes: int = 0
    feedback_notes: List[str]

class TailorRequest(BaseModel):
    job_title: Optional[str] = None
    company: Optional[str] = None
    job_description: Optional[str] = None
    job_url: Optional[str] = None
    base_latex: Optional[str] = None
    user_system_prompt: Optional[str] = None
    variance_level: Optional[str] = "balanced" # "strict", "balanced", "growth"
    confirmed_skills: Optional[List[str]] = []
    declined_skills: Optional[List[str]] = []
    skill_notes: Optional[Dict[str, str]] = {}

class TailorResponse(BaseModel):
    id: str
    job_title: str
    company: str
    tailored_latex: str
    ats_score: int
    ats_breakdown: AtsBreakdown
    matched_keywords: List[str]
    missing_skills: List[SkillGapItem]
    diff_summary: List[str]
    status: str # "ready", "needs_clarification"

class ChatEditRequest(BaseModel):
    current_latex: str
    instruction: str
    job_description: Optional[str] = None
    user_system_prompt: Optional[str] = None

class ChatEditResponse(BaseModel):
    updated_latex: str
    explanation: str
    changes: List[str]

class CompileRequest(BaseModel):
    latex_code: str
    filename: Optional[str] = "resume"

class SettingsModel(BaseModel):
    system_prompt: str
    forbidden_words: List[str] = ["spearheaded", "synergized", "leverage", "game-changing", "tapestry", "delve"]
    enforce_no_em_dashes: bool = True
    gemini_model: str = "gemini-3.8-flash"
    gemini_api_key: str = ""
