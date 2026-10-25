/**
 * LaTeX Parser & Serializer for ResumeAI Visual Text Mode.
 * Seamlessly abstracts LaTeX syntax away from the user while generating
 * production-ready, ATS-optimized, compilable LaTeX in the background.
 */

export interface EducationItem {
  id: string;
  institution: string;
  location: string;
  degree: string;
  dates: string;
}

export interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  location: string;
  dates: string;
  bullets: string[];
}

export interface ProjectItem {
  id: string;
  name: string;
  tech: string;
  dates: string;
  description: string;
  link: string;
  bullets: string[];
}

export interface SkillsCategory {
  languages: string;
  frameworks: string;
  cloud: string;
  tools: string;
}

export interface ResumeModel {
  name: string;
  phone: string;
  email: string;
  linkedin: string;
  github: string;
  education: EducationItem[];
  experience: ExperienceItem[];
  projects: ProjectItem[];
  skills: SkillsCategory;
  preamble: string;
}

/**
 * Extracts N curly-braced arguments from text starting at startIndex, handling nested braces correctly.
 */
export function extractBracedArgs(str: string, startIndex = 0, maxArgs = 1): { args: string[]; nextIndex: number } {
  const args: string[] = [];
  let i = startIndex;
  while (args.length < maxArgs && i < str.length) {
    while (i < str.length && str[i] !== "{") i++;
    if (i >= str.length) break;
    i++; // skip opening {
    let depth = 1;
    const start = i;
    while (i < str.length && depth > 0) {
      if (str[i] === "{" && (i === 0 || str[i - 1] !== "\\")) {
        depth++;
      } else if (str[i] === "}" && (i === 0 || str[i - 1] !== "\\")) {
        depth--;
      }
      i++;
    }
    args.push(str.substring(start, i - 1));
  }
  return { args, nextIndex: i };
}

/**
 * Strips raw LaTeX commands, backslashes, and tags, returning clean human-readable text.
 */
export function cleanLatexText(text: string): string {
  if (!text) return "";
  let s = text;
  // Unescape standard TeX symbols
  s = s.replace(/\\%/g, "%");
  s = s.replace(/\\&/g, "&");
  s = s.replace(/\\\$/g, "$");
  s = s.replace(/\\_/g, "_");
  s = s.replace(/\\#/g, "#");
  // Remove formatting macros
  s = s.replace(/\\(?:textbf|emph|textit|small|underline|scshape|Huge|large|normalsize)\{([^}]*)\}/g, "$1");
  s = s.replace(/\\(?:scshape|Huge|large|small|normalsize)\s+/g, "");
  // Remove dangling layout macros
  s = s.replace(/\\vspace\{[^}]*\}/g, "");
  s = s.replace(/\\href\{[^}]*\}\{([^}]*)\}/g, "$1");
  s = s.replace(/\\\\/g, " ");
  s = s.replace(/\$\|\$/g, "|");
  // Clean multiple whitespace
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

/**
 * Escapes characters that are reserved in LaTeX before compiling,
 * and enforces the strict rule: NO em dashes (only en-dash --).
 */
export function escapeLatexText(text: string): string {
  if (!text) return "";
  let s = text;
  // Strictly enforce no em-dashes
  s = s.replace(/—/g, "--");
  // Escape unescaped %
  s = s.replace(/(?<!\\)%/g, "\\%");
  // Escape unescaped &
  s = s.replace(/(?<!\\)&/g, "\\&");
  // Escape unescaped $
  s = s.replace(/(?<!\\)\$/g, "\\$");
  // Escape unescaped _
  s = s.replace(/(?<!\\)_/g, "\\_");
  // Escape unescaped #
  s = s.replace(/(?<!\\)#/g, "\\#");
  return s.trim();
}

/**
 * Default fallback preamble if none exists.
 */
const DEFAULT_PREAMBLE = `\\documentclass[letterpaper,10pt]{article}

\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}

\\pagestyle{fancy}
\\fancyhf{}
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1.0in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}

\\urlstyle{same}

\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\raggedright\\large
}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]

\\newcommand{\\resumeItem}[1]{
  \\item\\small{
    {#1 \\vspace{-2pt}}
  }
}

\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & #2 \\\\
      \\textit{\\small#3} & \\textit{\\small #4} \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeSubItem}[1]{\\resumeItem{#1}\\vspace{-4pt}}
\\renewcommand\\labelitemii{$\\vcenter{\\hbox{\\tiny$\\bullet$}}$}
\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}
`;

/**
 * Parses raw LaTeX code into a clean, human-friendly ResumeModel.
 */
export function parseLatexToModel(latex: string): ResumeModel {
  const model: ResumeModel = {
    name: "Your Name",
    phone: "",
    email: "",
    linkedin: "",
    github: "",
    education: [],
    experience: [],
    projects: [],
    skills: {
      languages: "",
      frameworks: "",
      cloud: "",
      tools: "",
    },
    preamble: DEFAULT_PREAMBLE,
  };

  if (!latex || !latex.trim()) return model;

  // Extract preamble (everything before \begin{document})
  const docStartIdx = latex.indexOf("\\begin{document}");
  if (docStartIdx !== -1) {
    model.preamble = latex.substring(0, docStartIdx).trim();
  }

  // Extract Name from heading
  const nameMatch = latex.match(/\\textbf\{\\Huge\s+(?:\\scshape\s+)?([^}]+)\}/);
  if (nameMatch) {
    model.name = cleanLatexText(nameMatch[1]);
  } else {
    const fallbackName = latex.match(/\\Huge\s+(?:\\scshape\s+)?([^\\]+)/);
    if (fallbackName) model.name = cleanLatexText(fallbackName[1]);
  }

  // Extract Phone
  const phoneMatch = latex.match(/(\+?\d[\d\s\(\)\-\.]{7,}\d)/);
  if (phoneMatch) model.phone = phoneMatch[1].trim();

  // Extract Email
  const emailMatch = latex.match(/mailto:([^}]+)/) || latex.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (emailMatch) model.email = emailMatch[1].trim();

  // Extract LinkedIn
  const linkedinMatch = latex.match(/linkedin\.com\/in\/([^}\s\\$|]+)/);
  if (linkedinMatch) model.linkedin = cleanLatexText(linkedinMatch[1]);

  // Extract GitHub
  const githubMatch = latex.match(/github\.com\/([^}\s\\$|]+)/);
  if (githubMatch) model.github = cleanLatexText(githubMatch[1]);

  // Parse Education
  const eduStart = latex.indexOf("\\section{Education}");
  if (eduStart !== -1) {
    const nextSec = latex.indexOf("\\section{", eduStart + 15);
    const eduText = latex.substring(eduStart, nextSec !== -1 ? nextSec : undefined);
    const subheadings = eduText.split(/\\resumeSubheading/);
    for (let i = 1; i < subheadings.length; i++) {
      const { args } = extractBracedArgs(subheadings[i], 0, 4);
      if (args.length >= 2) {
        model.education.push({
          id: `edu-${i}-${Date.now()}`,
          institution: cleanLatexText(args[0] || ""),
          location: cleanLatexText(args[1] || ""),
          degree: cleanLatexText(args[2] || ""),
          dates: cleanLatexText(args[3] || ""),
        });
      }
    }
  }

  // Parse Experience
  const expStart = latex.indexOf("\\section{Experience}");
  if (expStart !== -1) {
    const nextSec = latex.indexOf("\\section{", expStart + 16);
    const expText = latex.substring(expStart, nextSec !== -1 ? nextSec : undefined);
    const subheadings = expText.split(/\\resumeSubheading/);
    for (let i = 1; i < subheadings.length; i++) {
      const part = subheadings[i];
      const { args, nextIndex } = extractBracedArgs(part, 0, 4);
      const bullets: string[] = [];
      const itemParts = part.substring(nextIndex).split(/\\resumeItem/);
      for (let b = 1; b < itemParts.length; b++) {
        const bRes = extractBracedArgs(itemParts[b], 0, 1);
        if (bRes.args.length > 0) {
          bullets.push(cleanLatexText(bRes.args[0]));
        }
      }
      model.experience.push({
        id: `exp-${i}-${Date.now()}`,
        role: cleanLatexText(args[0] || ""),
        location: cleanLatexText(args[1] || ""),
        company: cleanLatexText(args[2] || ""),
        dates: cleanLatexText(args[3] || ""),
        bullets: bullets.length > 0 ? bullets : [""],
      });
    }
  }

  // Parse Projects
  const projStart = latex.indexOf("\\section{Projects}");
  if (projStart !== -1) {
    const nextSec = latex.indexOf("\\section{", projStart + 14);
    const projText = latex.substring(projStart, nextSec !== -1 ? nextSec : undefined);
    const subheadings = projText.split(/\\resumeSubheading/);
    for (let i = 1; i < subheadings.length; i++) {
      const part = subheadings[i];
      const { args, nextIndex } = extractBracedArgs(part, 0, 4);
      const rawTitle = cleanLatexText(args[0] || "");
      const titleParts = rawTitle.split("|").map((t) => t.trim());
      const bullets: string[] = [];
      const itemParts = part.substring(nextIndex).split(/\\resumeItem/);
      for (let b = 1; b < itemParts.length; b++) {
        const bRes = extractBracedArgs(itemParts[b], 0, 1);
        if (bRes.args.length > 0) {
          bullets.push(cleanLatexText(bRes.args[0]));
        }
      }
      model.projects.push({
        id: `proj-${i}-${Date.now()}`,
        name: titleParts[0] || rawTitle,
        tech: titleParts[1] || "",
        dates: cleanLatexText(args[1] || ""),
        description: cleanLatexText(args[2] || ""),
        link: cleanLatexText(args[3] || ""),
        bullets: bullets.length > 0 ? bullets : [""],
      });
    }
  }

  // Parse Technical Skills
  const skillsStart = latex.indexOf("\\section{Technical Skills}");
  if (skillsStart !== -1) {
    const skillsText = latex.substring(skillsStart);
    const regex = /\\textbf\{([^}]+)\}\{\s*:\s*([^\\}]+)\}/g;
    let m;
    while ((m = regex.exec(skillsText)) !== null) {
      const cat = cleanLatexText(m[1]).toLowerCase();
      const val = cleanLatexText(m[2]);
      if (cat.includes("lang")) {
        model.skills.languages = val;
      } else if (cat.includes("frame") || cat.includes("librar")) {
        model.skills.frameworks = val;
      } else if (cat.includes("cloud") || cat.includes("devops")) {
        model.skills.cloud = val;
      } else if (cat.includes("tool") || cat.includes("developer")) {
        model.skills.tools = val;
      }
    }
  }

  return model;
}

/**
 * Serializes a ResumeModel back into beautiful, clean, compilable LaTeX.
 */
export function serializeModelToLatex(model: ResumeModel): string {
  const preamble = model.preamble || DEFAULT_PREAMBLE;

  // Contact line elements
  const contactParts: string[] = [];
  if (model.phone) contactParts.push(escapeLatexText(model.phone));
  if (model.email) {
    contactParts.push(`\\href{mailto:${model.email}}{\\underline{${model.email}}}`);
  }
  if (model.linkedin) {
    const handle = model.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, "").replace(/\/$/, "");
    contactParts.push(`\\href{https://linkedin.com/in/${handle}}{\\underline{linkedin.com/in/${handle}}}`);
  }
  if (model.github) {
    const handle = model.github.replace(/^https?:\/\/(www\.)?github\.com\//, "").replace(/\/$/, "");
    contactParts.push(`\\href{https://github.com/${handle}}{\\underline{github.com/${handle}}}`);
  }

  const contactLine = contactParts.join(" $|$ \n    ");

  // Education Section
  let eduLatex = "";
  if (model.education.length > 0) {
    eduLatex = `%-----------EDUCATION-----------
\\section{Education}
  \\resumeSubHeadingListStart
${model.education
  .map(
    (e) => `    \\resumeSubheading
      {${escapeLatexText(e.institution)}}{${escapeLatexText(e.location)}}
      {${escapeLatexText(e.degree)}}{${escapeLatexText(e.dates)}}`
  )
  .join("\n")}
  \\resumeSubHeadingListEnd\n`;
  }

  // Experience Section
  let expLatex = "";
  if (model.experience.length > 0) {
    expLatex = `%-----------EXPERIENCE-----------
\\section{Experience}
  \\resumeSubHeadingListStart
${model.experience
  .map((e) => {
    const bulletItems = e.bullets
      .filter((b) => b.trim().length > 0)
      .map((b) => `        \\resumeItem{${escapeLatexText(b)}}`)
      .join("\n");

    return `    \\resumeSubheading
      {${escapeLatexText(e.role)}}{${escapeLatexText(e.location)}}
      {${escapeLatexText(e.company)}}{${escapeLatexText(e.dates)}}
      \\resumeItemListStart
${bulletItems}
      \\resumeItemListEnd`;
  })
  .join("\n\n")}
  \\resumeSubHeadingListEnd\n`;
  }

  // Projects Section
  let projLatex = "";
  if (model.projects.length > 0) {
    projLatex = `%-----------PROJECTS-----------
\\section{Projects}
  \\resumeSubHeadingListStart
${model.projects
  .map((p) => {
    const bulletItems = p.bullets
      .filter((b) => b.trim().length > 0)
      .map((b) => `        \\resumeItem{${escapeLatexText(b)}}`)
      .join("\n");

    const header = p.tech
      ? `\\textbf{${escapeLatexText(p.name)}} $|$ \\emph{${escapeLatexText(p.tech)}}`
      : `\\textbf{${escapeLatexText(p.name)}}`;

    return `    \\resumeSubheading
      {${header}}{${escapeLatexText(p.dates)}}
      {${escapeLatexText(p.description)}}{${escapeLatexText(p.link)}}
      \\resumeItemListStart
${bulletItems}
      \\resumeItemListEnd`;
  })
  .join("\n\n")}
  \\resumeSubHeadingListEnd\n`;
  }

  // Technical Skills Section
  let skillsLatex = "";
  if (
    model.skills.languages ||
    model.skills.frameworks ||
    model.skills.cloud ||
    model.skills.tools
  ) {
    const skillLines: string[] = [];
    if (model.skills.languages) {
      skillLines.push(`     \\textbf{Languages}{: ${escapeLatexText(model.skills.languages)}} \\\\`);
    }
    if (model.skills.frameworks) {
      skillLines.push(`     \\textbf{Frameworks \\& Libraries}{: ${escapeLatexText(model.skills.frameworks)}} \\\\`);
    }
    if (model.skills.cloud) {
      skillLines.push(`     \\textbf{Cloud \\& DevOps}{: ${escapeLatexText(model.skills.cloud)}} \\\\`);
    }
    if (model.skills.tools) {
      skillLines.push(`     \\textbf{Developer Tools}{: ${escapeLatexText(model.skills.tools)}}`);
    }

    skillsLatex = `%-----------TECHNICAL SKILLS-----------
\\section{Technical Skills}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
${skillLines.join("\n")}
    }}
 \\end{itemize}\n`;
  }

  return `${preamble.trim()}

%-------------------------------------------
%%%%%%  RESUME STARTS HERE  %%%%%%%%%%%%%%%%%%%%%%%%%%%%

\\begin{document}

%----------HEADING----------
\\begin{center}
    \\textbf{\\Huge \\scshape ${escapeLatexText(model.name)}} \\\\ \\vspace{2pt}
    \\small ${contactLine}
\\end{center}

${eduLatex}
${expLatex}
${projLatex}
${skillsLatex}
\\end{document}
`.trim();
}
