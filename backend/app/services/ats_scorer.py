import re
from typing import Dict, List, Any, Tuple
from backend.app.models import AtsBreakdown

COMMON_TECH_SKILLS = [
    "python", "typescript", "javascript", "go", "golang", "rust", "c++", "c#", "java", "ruby", "php", "swift", "kotlin",
    "react", "next.js", "vue", "angular", "node.js", "express", "fastapi", "django", "flask", "spring boot", "graphql",
    "docker", "kubernetes", "aws", "gcp", "azure", "terraform", "ci/cd", "github actions", "redis", "postgresql", "mysql",
    "mongodb", "kafka", "rabbitmq", "elasticsearch", "etcd", "grpc", "rest api", "microservices", "distributed systems",
    "linux", "git", "prometheus", "grafana", "datadog", "opentelemetry", "pytorch", "tensorflow", "llm", "rag", "langchain",
    "sql", "nosql", "tailwind", "css", "html"
]

STRONG_ACTION_VERBS = {
    "architected", "engineered", "designed", "developed", "implemented", "scaled", "optimized",
    "automated", "reduced", "accelerated", "constructed", "built", "authored", "deployed",
    "streamlined", "orchestrated", "consolidated", "launched", "eliminated", "delivered",
    "spearheaded", "mentored", "maintained", "instrumented"
}

WEAK_OR_CLICHE_VERBS = {
    "synergized", "leveraged", "game-changing", "tapestry", "delve",
    "worked on", "helped", "assisted", "responsible for", "participated in"
}

def extract_keywords_from_text(text: str) -> List[str]:
    """Extract recognized skills and domain keywords from arbitrary text."""
    text_lower = text.lower()
    found = set()
    for skill in COMMON_TECH_SKILLS:
        pattern = r"\b" + re.escape(skill) + r"\b"
        if re.search(pattern, text_lower):
            found.add(skill)
            
    # Also capture capitalized tech acronyms or capitalized skill terms
    custom_terms = re.findall(r"\b[A-Z][a-zA-Z0-9\.\+#]{2,15}\b", text)
    for term in custom_terms:
        term_clean = term.lower()
        if term_clean in COMMON_TECH_SKILLS or (len(term) >= 3 and term.isupper()):
            found.add(term_clean)
            
    return sorted(list(found))

def score_resume_against_job(resume_latex: str, job_description: str, forbidden_words: List[str] = None) -> AtsBreakdown:
    """
    Computes an objective, deeply quantified ATS Match Score & Breakdown.
    """
    forbidden_words = forbidden_words or ["synergized", "leverage", "game-changing", "tapestry", "delve"]
    
    # 1. Keywords Match
    jd_keywords = extract_keywords_from_text(job_description)
    resume_keywords = extract_keywords_from_text(resume_latex)
    
    if not jd_keywords:
        # General tech baseline
        jd_keywords = ["python", "typescript", "react", "fastapi", "docker", "aws", "sql", "git"]
        
    matched = [k for k in jd_keywords if k in resume_keywords]
    missing = [k for k in jd_keywords if k not in resume_keywords]
    
    keyword_match_score = int((len(matched) / max(len(jd_keywords), 1)) * 100)
    
    # 2. Impact & Metrics Detection
    # Robust bullet point extractor supporting nested braces and newlines
    bullet_items = re.findall(r"\\resumeItem\{((?:[^{}]|\{[^{}]*\})*)\}", resume_latex, re.DOTALL)
    if not bullet_items:
        bullet_items = re.findall(r"\\item\s+(.*?)(?=\\item|\\end|\Z)", resume_latex, re.DOTALL)
    total_bullets = max(len(bullet_items), 1)
    
    metric_bullets = 0
    metric_pattern = re.compile(r"(\d+[\d,\.]*\%|\$\d+[\d,\.]*|\d+x|\d+\s*(?:ms|sec|rps|qps|gb|tb|events|users|queries|million|k))", re.IGNORECASE)
    
    action_verb_count = 0
    cliche_penalty = 0
    
    for b in bullet_items:
        clean_bullet = re.sub(r"\\[a-zA-Z]+(?:\{[^}]*\})?", "", b).strip()
        clean_bullet = re.sub(r"\s+", " ", clean_bullet)
        if metric_pattern.search(clean_bullet):
            metric_bullets += 1
            
        first_word = clean_bullet.split()[0].lower() if clean_bullet.split() else ""
        first_word = re.sub(r"[^\w]", "", first_word)
        if first_word in STRONG_ACTION_VERBS or first_word.endswith("ed"):
            action_verb_count += 1
            
        for fw in forbidden_words:
            if fw.lower() in clean_bullet.lower():
                cliche_penalty += 5

    impact_score = min(100, int((metric_bullets / total_bullets) * 110))
    action_verbs_score = max(0, min(100, int((action_verb_count / total_bullets) * 105) - cliche_penalty))
    
    # 3. Formatting & Typography Hygiene
    em_dash_count = resume_latex.count("—")
    formatting_score = 100
    feedback_notes = []
    
    if em_dash_count > 0:
        formatting_score -= min(30, em_dash_count * 10)
        feedback_notes.append(f"Contains {em_dash_count} em dash(es) ('—'). We automatically normalize this to LaTeX '--' for clean ATS typesetting.")
    else:
        feedback_notes.append("Clean typography: zero em dashes detected (Pure LaTeX standard).")
        
    # Check core sections with robust alias matching
    essential_sections = [
        ("Education", ["education", "academic background"]),
        ("Experience", ["experience", "employment", "work history"]),
        ("Skills", ["skills", "technical skills", "technologies", "core competencies"])
    ]
    missing_sections = []
    latex_lower = resume_latex.lower()
    for name, aliases in essential_sections:
        found = any(f"\\section{{{alias}" in latex_lower or f"\\section*{{{alias}" in latex_lower for alias in aliases)
        if not found:
            missing_sections.append(name)

    if missing_sections:
        formatting_score -= (len(missing_sections) * 15)
        feedback_notes.append(f"Missing core section(s): {', '.join(missing_sections)}.")
    else:
        feedback_notes.append("All core ATS sections verified (Education, Experience, Technical Skills).")
        
    formatting_score = max(20, min(100, formatting_score))
    
    # Weighted Overall Score
    overall_score = int(
        (0.40 * keyword_match_score) +
        (0.25 * impact_score) +
        (0.20 * action_verbs_score) +
        (0.15 * formatting_score)
    )
    
    if impact_score > 70:
        feedback_notes.append(f"Strong quantification: {metric_bullets} of {total_bullets} bullet points include concrete metrics.")
    else:
        feedback_notes.append(f"Add metrics: {metric_bullets} of {total_bullets} bullet points include numbers or percentages.")

    return AtsBreakdown(
        overall_score=overall_score,
        keyword_match_score=keyword_match_score,
        impact_metrics_score=impact_score,
        action_verbs_score=action_verbs_score,
        formatting_hygiene_score=formatting_score,
        matched_keywords=matched,
        missing_keywords=missing,
        detected_em_dashes=em_dash_count,
        feedback_notes=feedback_notes
    )
