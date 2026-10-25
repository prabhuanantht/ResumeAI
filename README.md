# ResumeAI — AI-Powered LaTeX Resume Builder & ATS Engine

An aesthetic, developer-crafted web application for crafting high-yield, ATS-optimized LaTeX resumes tailored for any job opening.

---

## 🌟 Key Architectural Features

1. **Dual Visual & Code Studio (`/studio`)**:
   - **Visual Text Mode (Default)**: Intuitive card-based editing interface for Personal Info, Experience, Education, Projects, Skills, and dynamic custom sections—no LaTeX knowledge required.
   - **Raw Code Editor**: Split-screen Monaco Code Editor with LaTeX syntax highlighting, line numbers, word wrap, and automatic compilation for power users.
   - **Sub-Second PDF Preview**: High-fidelity PDF viewer powered by the ultra-fast Rust-based **Tectonic LaTeX engine** (sub-second local compilation, no bloated MacTeX install needed).
   - **Instant Recompilation**: Keyboard shortcut <kbd>⌘S</kbd> / <kbd>Ctrl+S</kbd> or the reload icon to instantly recompile.
   - **Multi-Format Exports**: Direct download as **PDF (.pdf)**, Word **(.docx)**, and raw LaTeX **(.tex)**.

2. **Resume Import & Instant AI Conversion**:
   - Seamless drag-and-drop file upload supporting **PDF (.pdf)**, Word **(.docx)**, and plaintext **(.txt)**.
   - Automatic resume structure extraction and compilation into ATS-proof LaTeX and editable visual text cards.
   - Curated gallery of battle-tested industry templates (SWE, Product, Data/ML, Minimalist).

3. **Target Job Profiling & Deep ATS Scorer (`/tailor`)**:
   - Accepts either a **Job Post URL** (auto-scrapes title, company, requirements from popular job sites) or **raw job description text**.
   - ATS Scoring Engine computes:
     - **Overall ATS Match Score** (0–100%)
     - **Keyword Coverage %** (Matched vs. Missing target tech keywords)
     - **Quantifiable Impact %** (Detection of metrics: %, $, latency, RPS, scale)
     - **Action Verb Strength** (Google X-Y-Z formula: Accomplished [X] by doing [Z] as measured by [Y])
     - **Typography Hygiene** (Checks for 0 em-dashes and proper LaTeX escaping).

4. **Honest Skill Gap Alignment & Learning Roadmaps**:
   - When a job description requires technologies not found in your base resume, **it never fabricates fake claims**.
   - Triggers an interactive dialogue asking:
     - *"I know this!"* &rarr; User confirms and optionally adds context; immediately integrates into technical skills and bullet points.
     - *"I need to learn this"* &rarr; Keeps the resume truthful and generates a structured, fast-track 3-step learning roadmap!

5. **Typography Hygiene: Strict Zero Em Dashes**:
   - Client and server-side filters strictly eliminate em dashes (`—`), standardizing all date ranges with standard LaTeX en dashes (`--`) and hyphens.

6. **User-Editable System Prompt & Negative Constraints (`/settings`)**:
   - Customize the exact prompt Gemini uses during tailoring.
   - Banned buzzword manager: strips AI clichés like *spearheaded*, *synergized*, *leverage*, *game-changing*, *tapestry*, *delve*.
   - Model switcher (`gemini-2.5-flash`, `gemini-1.5-flash`, `gemini-1.5-pro`).
   - Free Gemini API key storage.

7. **In-Editor AI Copilot**:
   - Natural language assistant to make pinpoint revisions directly to the content (e.g., *"Make bullet 2 more metric-driven"*, *"Tighten margins to fit single page"*).

8. **Aesthetic 3D Ambient Canvas**:
   - Lightweight Three.js geometric constellation lattice reacting smoothly to cursor movement.

---

## 🏗 Monorepo Architecture

```
ResumeBuilder/
├── backend/                   # Python FastAPI service
│   ├── app/
│   │   ├── main.py            # FastAPI server & route handlers
│   │   ├── config.py          # Environment settings & default prompt
│   │   ├── database.py        # SQLite persistent storage (aiosqlite)
│   │   ├── models.py          # Pydantic schemas
│   │   ├── services/
│   │   │   ├── compiler.py    # Tectonic LaTeX-to-PDF & Word-to-DOCX export
│   │   │   ├── ats_scorer.py  # Quantified ATS & keyword engine
│   │   │   ├── scraper.py     # Job URL web scraper
│   │   │   ├── gemini.py      # Google Gemini LLM & fallback engine
│   │   │   └── templates.py   # Curated ATS-proof LaTeX templates
│   │   └── routes/
│   │       ├── auth.py        # Google Auth endpoints
│   │       ├── resume.py      # Profile & base resume management
│   │       ├── tailor.py      # Tailoring & skill gap resolution
│   │       ├── compile.py     # Live PDF/DOCX compile endpoints
│   │       └── settings.py    # User system prompt & constraints
│   ├── requirements.txt
│   └── venv/
├── frontend/                  # Next.js 16 (App Router) + Tailwind CSS + Framer Motion
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx       # 3D landing & interactive showcase
│   │   │   ├── studio/        # Dual visual text & LaTeX editor + live PDF
│   │   │   ├── tailor/        # Job input, ATS scorecard & skill gaps
│   │   │   └── settings/      # System prompt & forbidden words editor
│   │   ├── components/
│   │   │   ├── 3d/AmbientCanvas.tsx  # Interactive Three.js canvas
│   │   │   ├── editor/        # Visual resume editor, Monaco LaTeX editor & PDF viewer
│   │   │   ├── tailor/        # ATS scorecard & skill gap dialog
│   │   │   ├── upload/        # Resume file import modal with AI parsing
│   │   │   └── navigation/    # Sleek navigation header
│   │   └── lib/               # Typed API client, LaTeX parser & utils
│   └── package.json
├── run.sh                     # 1-command startup script
└── README.md
```

---

## 🚀 Quickstart Guide

### Prerequisites
- **Node.js**: v18+ (tested on Node v20/v24)
- **Python**: 3.10+ (tested on Python 3.14)
- **Tectonic LaTeX Engine**: `brew install tectonic pandoc` (ultra-fast, self-contained LaTeX compiler)

### 1-Command Startup

```bash
./run.sh
```

Or run the services independently:

#### Backend:
```bash
cd backend
source venv/bin/activate
uvicorn backend.app.main:app --reload --port 8000
```
API Documentation is available at: [http://localhost:8000/docs](http://localhost:8000/docs)

#### Frontend:
```bash
cd frontend
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Environment Variables (Optional / Free Tier)

Both services work out of the box with realistic fallback data even without any API keys.
To activate live Gemini generation:

1. Obtain a free API key from [Google AI Studio](https://aistudio.google.com).
2. Either add it in the Settings page in the UI (`/settings`) or set:
   ```bash
   export GEMINI_API_KEY="your_free_key_here"
   export GEMINI_MODEL="gemini-2.5-flash"
   ```

---

## 🛡️ License

MIT License — 100% Free and Open Source.
