import re
import httpx
from bs4 import BeautifulSoup
from typing import Dict, Optional

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/123.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

async def scrape_job_url(url: str) -> Dict[str, str]:
    """
    Scrapes job details (title, company, description) from job board or company career page URLs.
    """
    clean_url = url.strip()
    if not clean_url.startswith("http://") and not clean_url.startswith("https://"):
        clean_url = "https://" + clean_url

    try:
        async with httpx.AsyncClient(timeout=12.0, follow_redirects=True, headers=HEADERS) as client:
            resp = await client.get(clean_url)
            if resp.status_code != 200:
                return {
                    "job_title": "Position from URL",
                    "company": "Company",
                    "description": f"Failed to retrieve page automatically (Status {resp.status_code}). Please paste the job description text directly."
                }
            html = resp.text
    except Exception as e:
        return {
            "job_title": "Position from URL",
            "company": "Company",
            "description": f"Network fetch error ({str(e)}). Please paste the job description text directly."
        }

    soup = BeautifulSoup(html, "html.parser")

    # Remove non-content elements
    for el in soup(["script", "style", "nav", "header", "footer", "noscript", "svg", "button"]):
        el.decompose()

    # Try extracting meta tags or title
    page_title = soup.title.string.strip() if soup.title and soup.title.string else ""
    
    # Try finding job title from standard tags
    job_title = ""
    title_el = (
        soup.find("h1") or
        soup.find(class_=re.compile(r"job-title|posting-headline|title", re.I))
    )
    if title_el:
        job_title = title_el.get_text(strip=True)
    elif page_title:
        # e.g., "Senior Software Engineer at Stripe - Careers"
        job_title = page_title.split("|")[0].split("-")[0].strip()

    # Try company name
    company = ""
    company_el = soup.find(class_=re.compile(r"company|organization|employer", re.I))
    if company_el:
        company = company_el.get_text(strip=True)
    elif "at " in page_title:
        parts = page_title.split("at ")
        if len(parts) > 1:
            company = parts[1].split()[0].replace("-", "").strip()

    # Main job content container
    content_container = (
        soup.find("div", class_=re.compile(r"job-description|posting-page|description|content", re.I)) or
        soup.find("main") or
        soup.find("article") or
        soup.body
    )

    if content_container:
        raw_text = content_container.get_text(separator="\n")
    else:
        raw_text = soup.get_text(separator="\n")

    # Clean whitespace
    lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
    description = "\n".join(lines[:300]) # Cap to prevent huge payloads

    return {
        "job_title": job_title or "Software Engineer",
        "company": company or "Target Company",
        "description": description or f"Job Description imported from {clean_url}"
    }
