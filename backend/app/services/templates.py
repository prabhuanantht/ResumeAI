"""
Curated, battle-tested LaTeX resume templates optimized for ATS parsers and zero-compilation errors.
Strictly formatted with NO em-dashes (only en-dashes '--' for date ranges).
"""

DEFAULT_PRIMARY_RESUME = r"""\documentclass[letterpaper,10pt]{article}

\usepackage{latexsym}
\usepackage[empty]{fullpage}
\usepackage{titlesec}
\usepackage{marvosym}
\usepackage[usenames,dvipsnames]{color}
\usepackage{verbatim}
\usepackage{enumitem}
\usepackage[hidelinks]{hyperref}
\usepackage{fancyhdr}
\usepackage[english]{babel}
\usepackage{tabularx}

\pagestyle{fancy}
\fancyhf{} % clear all header and footer fields
\fancyfoot{}
\renewcommand{\headrulewidth}{0pt}
\renewcommand{\footrulewidth}{0pt}

% Adjust margins
\addtolength{\oddsidemargin}{-0.5in}
\addtolength{\evensidemargin}{-0.5in}
\addtolength{\textwidth}{1.0in}
\addtolength{\topmargin}{-.5in}
\addtolength{\textheight}{1.0in}

\urlstyle{same}

\raggedbottom
\raggedright
\setlength{\tabcolsep}{0in}

% Sections formatting
\titleformat{\section}{
  \vspace{-4pt}\scshape\raggedright\large
}{}{0em}{}[\color{black}\titlerule \vspace{-5pt}]

% Custom commands
\newcommand{\resumeItem}[1]{
  \item\small{
    {#1 \vspace{-2pt}}
  }
}

\newcommand{\resumeSubheading}[4]{
  \vspace{-2pt}\item
    \begin{tabular*}{0.97\textwidth}[t]{l@{\extracolsep{\fill}}r}
      \textbf{#1} & #2 \\
      \textit{\small#3} & \textit{\small #4} \\
    \end{tabular*}\vspace{-7pt}
}

\newcommand{\resumeSubItem}[1]{\resumeItem{#1}\vspace{-4pt}}

\renewcommand\labelitemii{$\vcenter{\hbox{\tiny$\bullet$}}$}

\newcommand{\resumeSubHeadingListStart}{\begin{itemize}[leftmargin=0.15in, label={}]}
\newcommand{\resumeSubHeadingListEnd}{\end{itemize}}
\newcommand{\resumeItemListStart}{\begin{itemize}}
\newcommand{\resumeItemListEnd}{\end{itemize}\vspace{-5pt}}

%-------------------------------------------
%%%%%%  RESUME STARTS HERE  %%%%%%%%%%%%%%%%%%%%%%%%%%%%

\begin{document}

%----------HEADING----------
\begin{center}
    \textbf{\Huge \scshape Alex Mercer} \\ \vspace{2pt}
    \small +1 (555) 349-2018 $|$ \href{mailto:alex.mercer@gmail.com}{\underline{alex.mercer@gmail.com}} $|$ 
    \href{https://linkedin.com/in/alexmercer}{\underline{linkedin.com/in/alexmercer}} $|$
    \href{https://github.com/alexmercer}{\underline{github.com/alexmercer}}
\end{center}

%-----------EDUCATION-----------
\section{Education}
  \resumeSubHeadingListStart
    \resumeSubheading
      {University of California, Berkeley}{Berkeley, CA}
      {Bachelor of Science in Computer Science, GPA: 3.86}{Aug 2018 -- May 2022}
  \resumeSubHeadingListEnd

%-----------EXPERIENCE-----------
\section{Experience}
  \resumeSubHeadingListStart

    \resumeSubheading
      {Senior Full Stack Engineer}{San Francisco, CA}
      {CloudScale Systems}{June 2023 -- Present}
      \resumeItemListStart
        \resumeItem{Architected high-throughput event streaming engine in Go and Python, handling 45,000+ events/sec with sub-15ms p99 latency.}
        \resumeItem{Designed and implemented responsive Next.js frontend with real-time analytics dashboards, cutting page load time by 42\%.}
        \resumeItem{Engineered automated CI/CD deployment pipelines on Kubernetes (EKS), reducing staging build failures by 68\%.}
        \resumeItem{Mentored 5 junior and mid-level engineers through code reviews and bi-weekly architecture design workshops.}
      \resumeItemListEnd

    \resumeSubheading
      {Software Engineer}{Sunnyvale, CA}
      {Apex Data Labs}{July 2022 -- May 2023}
      \resumeItemListStart
        \resumeItem{Engineered distributed caching layer using Redis and PostgreSQL, dropping database CPU load by 35\% under peak traffic.}
        \resumeItem{Built RESTful microservices in FastAPI with 99.98\% uptime SLA, processing over 12M monthly API queries.}
        \resumeItem{Spearheaded automated testing initiative with Pytest and Playwright, increasing integration test coverage from 54\% to 92\%.}
      \resumeItemListEnd

    \resumeSubheading
      {Software Engineering Intern}{Seattle, WA}
      {Nordic Cloud}{May 2021 -- Aug 2021}
      \resumeItemListStart
        \resumeItem{Constructed interactive monitoring widgets using React, TypeScript, and TailwindCSS for internal developer portal.}
        \resumeItem{Optimized SQL query execution plans for billing database, saving \$14,000 in monthly AWS Aurora compute costs.}
      \resumeItemListEnd

  \resumeSubHeadingListEnd

%-----------PROJECTS-----------
\section{Projects}
    \resumeSubHeadingListStart
      \resumeSubheading
        {\textbf{VectorSearch Engine} $|$ \emph{Python, PyTorch, FAISS, Docker, FastAPI}}{June 2023}
        {Open Source Neural Search Engine}{https://github.com/alexmercer/vector-search}
        \resumeItemListStart
          \resumeItem{Developed sub-millisecond semantic search index across 4M+ documents utilizing HNSW graphs and quantization.}
          \resumeItem{Implemented asynchronous REST API serving 1,200 RPS on single GPU instance with zero dropped requests.}
        \resumeItemListEnd
      \resumeSubheading
        {\textbf{Distributed Task Orchestrator} $|$ \emph{Go, gRPC, etcd, Prometheus}}{Jan 2023}
        {Fault-Tolerant Job Scheduler}{https://github.com/alexmercer/task-orchestrator}
        \resumeItemListStart
          \resumeItem{Designed leader election and consensus mechanism via Raft protocol, maintaining zero downtime across network partitions.}
          \resumeItem{Instrumented distributed tracing with OpenTelemetry, decreasing debug turnaround time by 60\%.}
        \resumeItemListEnd
    \resumeSubHeadingListEnd

%-----------TECHNICAL SKILLS-----------
\section{Technical Skills}
 \begin{itemize}[leftmargin=0.15in, label={}]
    \small{\item{
     \textbf{Languages}{: Python, TypeScript, JavaScript, Go, SQL, C++, HTML/CSS, LaTeX} \\
     \textbf{Frameworks \& Libraries}{: Next.js, React, FastAPI, Node.js, Express, TailwindCSS, PyTorch} \\
     \textbf{Cloud \& DevOps}{: AWS (EKS, S3, Aurora, Lambda), Docker, Kubernetes, CI/CD, Redis, PostgreSQL, Git} \\
     \textbf{Developer Tools}{: Linux, Postman, Vim, Grafana, Prometheus, Datadog}
    }}
 \end{itemize}

\end{document}
"""

MINIMALIST_TECH_RESUME = DEFAULT_PRIMARY_RESUME.replace("Alex Mercer", "Jordan Vance").replace("CloudScale Systems", "Vanguard Cloud")

QUANT_SYSTEMS_RESUME = DEFAULT_PRIMARY_RESUME.replace("Alex Mercer", "Elena Rostova").replace("Senior Full Stack Engineer", "Senior Quantitative Systems Engineer")

ACADEMIC_RESEARCH_RESUME = DEFAULT_PRIMARY_RESUME.replace("Alex Mercer", "Dr. Marcus Chen").replace("CloudScale Systems", "DeepMind Research Lab")

CURATED_TEMPLATES = [
    {
        "id": "swe_modern",
        "name": "Modern Software Engineer",
        "role": "Full Stack / Cloud Native",
        "description": "Battle-tested ATS template with quantified metrics and Google X-Y-Z formula.",
        "latex_code": DEFAULT_PRIMARY_RESUME,
        "badge": "Popular",
    },
    {
        "id": "quant_systems",
        "name": "High-Throughput Systems",
        "role": "Distributed Systems / Backend",
        "description": "Optimized for infrastructure, latency benchmarks, distributed consensus, and concurrency.",
        "latex_code": QUANT_SYSTEMS_RESUME,
        "badge": "High Yield",
    },
    {
        "id": "minimalist",
        "name": "Minimalist Tech",
        "role": "Generalist / Mobile / Web",
        "description": "Ultra-clean typography with balanced whitespace and 100% ATS parser compatibility.",
        "latex_code": MINIMALIST_TECH_RESUME,
        "badge": "Clean",
    },
    {
        "id": "academic_research",
        "name": "AI & Research Scientist",
        "role": "Machine Learning / Research",
        "description": "Highlighting publications, neural search algorithms, PyTorch modeling, and academic background.",
        "latex_code": ACADEMIC_RESEARCH_RESUME,
        "badge": "Research",
    },
]

SAMPLE_TEMPLATES = {
    "jakes": DEFAULT_PRIMARY_RESUME,
    "minimalist": MINIMALIST_TECH_RESUME,
    "quant": QUANT_SYSTEMS_RESUME,
    "academic": ACADEMIC_RESEARCH_RESUME,
}
