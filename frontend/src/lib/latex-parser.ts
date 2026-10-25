/**
 * Dynamic Section LaTeX Parser & Serializer for ResumeAI.
 * Supports arbitrary sections: Experience, Education, Projects, Skills, Certifications,
 * Summary, Publications, Leadership, Awards, and custom blocks.
 */

export type SectionType = "subheadings" | "key_value" | "bullet_list" | "paragraph" | "raw";

export interface SubheadingItem {
  id: string;
  primaryTitle: string;    // e.g. Role, Project Name, Institution, Award
  secondaryTitle?: string;  // e.g. Company, Tech Stack, Degree
  location?: string;        // e.g. City, State
  dates?: string;           // e.g. June 2023 -- Present
  link?: string;            // e.g. https://github.com/...
  bullets: string[];        // Achievements & metric bullet points
}

export interface KeyValueCategory {
  id: string;
  label: string;  // e.g. Languages, Frameworks, Cloud & DevOps, Developer Tools
  value: string;  // e.g. Python, TypeScript, Docker, Kubernetes
}

export interface DynamicSection {
  id: string;
  title: string;          // Section title (e.g. Experience, Education, Summary)
  type: SectionType;
  items?: SubheadingItem[];        // For subheadings (Experience, Projects, Education, Leadership)
  categories?: KeyValueCategory[]; // For key-value categorized lists (Skills, Coursework)
  bullets?: string[];              // For simple bulleted lists (Certifications, Honors)
  content?: string;                // For multi-line text (Summary, Objective, Bio)
  rawLatex?: string;               // For unparsed custom LaTeX
}

export interface ResumeModel {
  name: string;
  phone: string;
  email: string;
  linkedin: string;
  github: string;
  sections: DynamicSection[];
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
export const DEFAULT_PREAMBLE = `\\documentclass[letterpaper,10pt]{article}

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
 * Parses raw LaTeX code into a comprehensive ResumeModel with dynamic arbitrary sections.
 */
export function parseLatexToModel(latex: string): ResumeModel {
  const model: ResumeModel = {
    name: "Candidate",
    phone: "",
    email: "",
    linkedin: "",
    github: "",
    sections: [],
    preamble: DEFAULT_PREAMBLE,
  };

  if (!latex || !latex.trim()) return model;

  // 1. Extract preamble (everything before \begin{document})
  const docStartIdx = latex.indexOf("\\begin{document}");
  if (docStartIdx !== -1) {
    model.preamble = latex.substring(0, docStartIdx).trim();
  }

  // 2. Extract Name from heading
  const nameMatch = latex.match(/\\textbf\{\\Huge\s+(?:\\scshape\s+)?([^}]+)\}/);
  if (nameMatch) {
    model.name = cleanLatexText(nameMatch[1]);
  } else {
    const fallbackName = latex.match(/\\Huge\s+(?:\\scshape\s+)?([^\\]+)/);
    if (fallbackName) model.name = cleanLatexText(fallbackName[1]);
  }

  // 3. Extract Contact Details
  const phoneMatch = latex.match(/(\+?\d[\d\s\(\)\-\.]{7,}\d)/);
  if (phoneMatch) model.phone = phoneMatch[1].trim();

  const emailMatch = latex.match(/mailto:([^}]+)/) || latex.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (emailMatch) model.email = emailMatch[1].trim();

  const linkedinMatch = latex.match(/linkedin\.com\/in\/([^}\s\\$|]+)/);
  if (linkedinMatch) model.linkedin = cleanLatexText(linkedinMatch[1]);

  const githubMatch = latex.match(/github\.com\/([^}\s\\$|]+)/);
  if (githubMatch) model.github = cleanLatexText(githubMatch[1]);

  // 4. Find all sections dynamically in document body
  const docEndIdx = latex.indexOf("\\end{document}");
  const bodyText = latex.substring(docStartIdx !== -1 ? docStartIdx : 0, docEndIdx !== -1 ? docEndIdx : undefined);

  const sectionRegex = /\\section\{([^}]+)\}/g;
  let match: RegExpExecArray | null;
  const sectionHeaders: Array<{ title: string; index: number; contentStart: number }> = [];

  while ((match = sectionRegex.exec(bodyText)) !== null) {
    sectionHeaders.push({
      title: match[1],
      index: match.index,
      contentStart: match.index + match[0].length,
    });
  }

  for (let i = 0; i < sectionHeaders.length; i++) {
    const current = sectionHeaders[i];
    const next = sectionHeaders[i + 1];
    const rawContent = bodyText.substring(current.contentStart, next ? next.index : undefined).trim();
    const cleanTitle = cleanLatexText(current.title);

    // Detect section type and parse appropriately
    if (rawContent.includes("\\resumeSubheading")) {
      // Subheading list (e.g. Experience, Projects, Education, Leadership)
      const subheadings = rawContent.split(/\\resumeSubheading/);
      const items: SubheadingItem[] = [];

      for (let s = 1; s < subheadings.length; s++) {
        const part = subheadings[s];
        const { args, nextIndex } = extractBracedArgs(part, 0, 4);
        const bullets: string[] = [];
        const itemParts = part.substring(nextIndex).split(/\\resumeItem/);

        for (let b = 1; b < itemParts.length; b++) {
          const bRes = extractBracedArgs(itemParts[b], 0, 1);
          if (bRes.args.length > 0) {
            bullets.push(cleanLatexText(bRes.args[0]));
          }
        }

        const rawPrimary = cleanLatexText(args[0] || "");
        const rawSec = cleanLatexText(args[2] || "");
        let primary = rawPrimary;
        let secondary = rawSec;
        let link = cleanLatexText(args[3] || "");

        // If projects have Title | Tech format
        if (cleanTitle.toLowerCase().includes("project") && rawPrimary.includes("|")) {
          const parts = rawPrimary.split("|").map((p) => p.trim());
          primary = parts[0];
          secondary = parts[1];
        }

        items.push({
          id: `item-${i}-${s}-${Date.now()}`,
          primaryTitle: primary,
          secondaryTitle: secondary,
          location: cleanLatexText(args[1] || ""),
          dates: cleanLatexText(args[3] || args[1] || ""),
          link: link.startsWith("http") ? link : undefined,
          bullets: bullets.length > 0 ? bullets : [""],
        });
      }

      model.sections.push({
        id: `sec-${i}-${cleanTitle.toLowerCase()}`,
        title: cleanTitle,
        type: "subheadings",
        items,
      });
    } else if (/\\textbf\{[^}]+\}\s*\{\s*:[^}]+\}/.test(rawContent) || rawContent.includes("\\textbf{")) {
      // Key-value categories (e.g. Technical Skills, Interests)
      const categories: KeyValueCategory[] = [];
      const regex = /\\textbf\{([^}]+)\}\{\s*:\s*([^\\}]+)\}/g;
      let m: RegExpExecArray | null;

      while ((m = regex.exec(rawContent)) !== null) {
        categories.push({
          id: `cat-${categories.length}-${Date.now()}`,
          label: cleanLatexText(m[1]),
          value: cleanLatexText(m[2]),
        });
      }

      // Fallback for simple key-values
      if (categories.length === 0) {
        const lines = rawContent.split("\\\\");
        for (const line of lines) {
          const cleaned = cleanLatexText(line);
          if (cleaned.includes(":")) {
            const [k, ...v] = cleaned.split(":");
            categories.push({
              id: `cat-${categories.length}-${Date.now()}`,
              label: k.trim(),
              value: v.join(":").trim(),
            });
          }
        }
      }

      model.sections.push({
        id: `sec-${i}-${cleanTitle.toLowerCase()}`,
        title: cleanTitle,
        type: "key_value",
        categories,
      });
    } else if (rawContent.includes("\\resumeItem") || rawContent.includes("\\item")) {
      // Simple bulleted list (e.g. Certifications, Awards, Honors)
      const bullets: string[] = [];
      const itemParts = rawContent.split(/\\(?:resumeItem|item)/);

      for (let b = 1; b < itemParts.length; b++) {
        const bRes = extractBracedArgs(itemParts[b], 0, 1);
        const bulletText = bRes.args.length > 0 ? bRes.args[0] : itemParts[b];
        const cleaned = cleanLatexText(bulletText);
        if (cleaned) bullets.push(cleaned);
      }

      model.sections.push({
        id: `sec-${i}-${cleanTitle.toLowerCase()}`,
        title: cleanTitle,
        type: "bullet_list",
        bullets: bullets.length > 0 ? bullets : [""],
      });
    } else {
      // Paragraph / summary or custom block
      const cleaned = cleanLatexText(rawContent);
      model.sections.push({
        id: `sec-${i}-${cleanTitle.toLowerCase()}`,
        title: cleanTitle,
        type: cleaned.length > 0 ? "paragraph" : "raw",
        content: cleaned,
        rawLatex: rawContent,
      });
    }
  }

  return model;
}

/**
 * Serializes a dynamic ResumeModel back into beautiful, clean, compilable LaTeX.
 */
export function serializeModelToLatex(model: ResumeModel): string {
  const preamble = model.preamble || DEFAULT_PREAMBLE;

  // 1. Contact line elements
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

  // 2. Dynamic Section Serialization
  const sectionBlocks: string[] = [];

  for (const sec of model.sections) {
    const escapedTitle = escapeLatexText(sec.title);

    if (sec.type === "subheadings" && sec.items && sec.items.length > 0) {
      const isProject = sec.title.toLowerCase().includes("project");
      const isEdu = sec.title.toLowerCase().includes("edu");

      const renderedItems = sec.items
        .map((item) => {
          const bullets = item.bullets
            .filter((b) => b.trim().length > 0)
            .map((b) => `        \\resumeItem{${escapeLatexText(b)}}`)
            .join("\n");

          const bulletBlock = bullets ? `\n      \\resumeItemListStart\n${bullets}\n      \\resumeItemListEnd` : "";

          if (isProject) {
            const header = item.secondaryTitle
              ? `\\textbf{${escapeLatexText(item.primaryTitle)}} $|$ \\emph{${escapeLatexText(item.secondaryTitle)}}`
              : `\\textbf{${escapeLatexText(item.primaryTitle)}}`;

            return `    \\resumeSubheading
      {${header}}{${escapeLatexText(item.dates || "")}}
      {${escapeLatexText(item.secondaryTitle || "")}}{${escapeLatexText(item.link || "")}}${bulletBlock}`;
          }

          if (isEdu) {
            return `    \\resumeSubheading
      {${escapeLatexText(item.primaryTitle)}}{${escapeLatexText(item.location || "")}}
      {${escapeLatexText(item.secondaryTitle || "")}}{${escapeLatexText(item.dates || "")}}${bulletBlock}`;
          }

          // Default Experience / Work item
          return `    \\resumeSubheading
      {${escapeLatexText(item.primaryTitle)}}{${escapeLatexText(item.location || "")}}
      {${escapeLatexText(item.secondaryTitle || "")}}{${escapeLatexText(item.dates || "")}}${bulletBlock}`;
        })
        .join("\n\n");

      sectionBlocks.push(`%-----------${escapedTitle.toUpperCase()}-----------
\\section{${escapedTitle}}
  \\resumeSubHeadingListStart
${renderedItems}
  \\resumeSubHeadingListEnd`);
    } else if (sec.type === "key_value" && sec.categories && sec.categories.length > 0) {
      const renderedCategories = sec.categories
        .filter((c) => c.label.trim() || c.value.trim())
        .map((c) => `     \\textbf{${escapeLatexText(c.label)}}{: ${escapeLatexText(c.value)}} \\\\`)
        .join("\n");

      sectionBlocks.push(`%-----------${escapedTitle.toUpperCase()}-----------
\\section{${escapedTitle}}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
${renderedCategories}
    }}
 \\end{itemize}`);
    } else if (sec.type === "bullet_list" && sec.bullets && sec.bullets.length > 0) {
      const renderedBullets = sec.bullets
        .filter((b) => b.trim().length > 0)
        .map((b) => `    \\resumeItem{${escapeLatexText(b)}}`)
        .join("\n");

      sectionBlocks.push(`%-----------${escapedTitle.toUpperCase()}-----------
\\section{${escapedTitle}}
 \\begin{itemize}[leftmargin=0.15in, label={}]
${renderedBullets}
 \\end{itemize}`);
    } else if (sec.type === "paragraph" && sec.content) {
      sectionBlocks.push(`%-----------${escapedTitle.toUpperCase()}-----------
\\section{${escapedTitle}}
${escapeLatexText(sec.content)}`);
    } else if (sec.rawLatex) {
      sectionBlocks.push(`%-----------${escapedTitle.toUpperCase()}-----------
\\section{${escapedTitle}}
${sec.rawLatex}`);
    }
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

${sectionBlocks.join("\n\n")}

\\end{document}
`.trim();
}
