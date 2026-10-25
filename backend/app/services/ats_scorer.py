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
    "streamlined", "orchestrated", "consolidated", "launched", "eliminated", "delivered"
}

WEAK_OR_CLICHE_VERBS = {
    "spearheaded", "synergized", "leveraged", "game-changing", "tapestry", "delve",
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
    forbidden_words = forbidden_words or ["spearheaded", "synergized", "leverage", "game-changing", "tapestry", "delve"]
    
    # 1. Keywords Match
    jd_keywords = extract_keywords_from_text(job_description)
    resume_keywords = extract_keywords_from_text(resume_latex)
    
    if not jd_keywords:
        # Fallback if JD is generic
        jd_keywords = ["python", "typescript", "react", "fastapi", "docker", "aws", "sql"]
        
    matched = [k for k in jd_keywords if k in resume_keywords]
    missing = [k for k in jd_keywords if k not in resume_keywords]
    
    keyword_match_score = int((len(matched) / max(len(jd_keywords), 1)) * 100)
    
    # 2. Impact & Metrics Detection
    # Look for bullet points in LaTeX
    bullet_items = re.findall(r"\\resumeItem\{([^}]+)\}", resume_latex) or re.findall(r"\\item\s*(.*)", resume_latex)
    total_bullets = max(len(bullet_items), 1)
    
    metric_bullets = 0
    metric_pattern = re.compile(r"(\d+[\d,\.]*\%|\$\d+[\d,\.]*|\d+x|\d+\s*(?:ms|sec|rps|qps|gb|tb|events|users|queries|million|k))", re.IGNORECASE)
    
    action_verb_count = 0
    cliche_penalty = 0
    
    for b in bullet_items:
        clean_bullet = re.sub(r"\\[a-zA-Z]+(?:\{[^}]*\})?", "", b).strip()
        if metric_pattern.search(clean_bullet):
            metric_bullets += 1
            
        first_word = clean_bullet.split()[0].lower() if clean_bullet.split() else ""
        if first_word in STRONG_ACTION_VERBS or first_word.endswith("ed"):
            action_verb_count += 1
            
        for fw in forbidden_words:
            if fw.lower() in clean_bullet.lower():
                cliche_penalty += 5

    impact_score = min(100, int((metric_bullets / total_bullets) * 115))
    action_verbs_score = max(0, min(100, int((action_verb_count / total_bullets) * 100) - cliche_penalty))
    
    # 3. Formatting & Typography Hygiene
    em_dash_count = resume_latex.count("—")
    formatting_score = 100
    feedback_notes = []
    
    if em_dash_count > 0:
        formatting_score -= min(30, em_dash_count * 10)
        feedback_notes.append(f"Contains {em_dash_count} em dash(es) ('—'). We automatically normalize this to LaTeX '--' for clean ATS typesetting.")
    else:
        feedback_notes.append("Clean typography: zero em dashes detected.")
        
    # Check sections
    essential_sections = ["education", "experience", "skills"]
    missing_sections = [sec for sec in essential_sections if f"\\section{{{sec}" not in resume_latex.lower()]
    if missing_sections:
        formatting_score -= (len(missing_sections) * 15)
        feedback_notes.append(f"Missing core section(s): {', '.join(missing_sections).title()}.")
    else:
        feedback_notes.append("All core ATS sections verified (Education, Experience, Skills).")
        
    formatting_score = max(20, min(100, formatting_score))
    
    # Weighted Overall Score
    overall_score = int(
        (0.40 * keyword_match_score) +
        (0.25 * impact_score) +
        (0.20 * action_verbs_score) +
        (0.15 * formatting_score)
    )
    
    if impact_score > 75:
        feedback_notes.append(f"Strong quantification: {metric_bullets} of {total_bullets} bullet points include concrete metrics.")
    else:
        feedback_notes.append("Opportunity: Add more quantifiable metrics (%, $, latency, scale) to your bullet points.")

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
