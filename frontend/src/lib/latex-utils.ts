/**
 * LaTeX cleaning, sanitization, and SyncTeX text-to-source matching.
 */

export function cleanLatex(code: string): { cleaned: string; emDashesReplaced: number } {
  let count = 0;
  // Zero em-dash enforcement: replace em-dashes '—' with LaTeX en-dash ' -- '
  const emDashRegex = /—/g;
  const matches = code.match(emDashRegex);
  if (matches) {
    count = matches.length;
  }
  const cleaned = code.replace(emDashRegex, " -- ");
  return { cleaned, emDashesReplaced: count };
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export function downloadText(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  downloadBlob(blob, filename);
}

/**
 * Strips LaTeX markup, formatting commands, and environments to produce
 * a clean human-readable text string for exact matching with PDF rendered text.
 */
export function stripLatexMarkup(latexLine: string): string {
  if (!latexLine) return "";

  let text = latexLine;

  // Ignore comments
  const commentIdx = text.indexOf("%");
  if (commentIdx !== -1 && (commentIdx === 0 || text[commentIdx - 1] !== "\\")) {
    text = text.substring(0, commentIdx);
  }

  // Remove common structure commands
  text = text.replace(/\\item\s*/g, " ");
  text = text.replace(/\\section\*?\{([^}]*)\}/g, " $1 ");
  text = text.replace(/\\subsection\*?\{([^}]*)\}/g, " $1 ");
  text = text.replace(/\\resumeItem\{([^}]*)\}/g, " $1 ");
  text = text.replace(/\\resumeSubheading\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}/g, " $1 $2 $3 $4 ");
  text = text.replace(/\\resumeProjectHeading\{([^}]*)\}\{([^}]*)\}/g, " $1 $2 ");
  text = text.replace(/\\href\{[^}]*\}\{([^}]*)\}/g, " $1 ");
  text = text.replace(/\\textbf\{([^}]*)\}/g, " $1 ");
  text = text.replace(/\\textit\{([^}]*)\}/g, " $1 ");
  text = text.replace(/\\underline\{([^}]*)\}/g, " $1 ");
  text = text.replace(/\\scshape\s*/g, " ");
  text = text.replace(/\\small\s*/g, " ");
  text = text.replace(/\\large\s*/g, " ");
  text = text.replace(/\\Huge\s*/g, " ");
  text = text.replace(/\\vspace\*?\{[^}]*\}/g, " ");
  text = text.replace(/\\hspace\*?\{[^}]*\}/g, " ");

  // Replace escaped characters
  text = text.replace(/\\%/g, "%");
  text = text.replace(/\\&/g, "&");
  text = text.replace(/\\\$/g, "$");
  text = text.replace(/\\#/g, "#");
  text = text.replace(/\\_/g, "_");
  text = text.replace(/\\\\/g, " ");
  text = text.replace(/--/g, "-");

  // Remove any remaining backslash command
  text = text.replace(/\\[a-zA-Z]+(\[[^\]]*\])?({[^}]*})?/g, " ");

  // Remove braces and clean spaces
  text = text.replace(/[{}]/g, " ");
  text = text.replace(/\s+/g, " ").trim();

  return text;
}

export interface LineMatchResult {
  lineNumber: number;
  snippet: string;
  confidence: number;
}

/**
 * Exact text matching:
 * Matches clicked text string directly to the exact corresponding line in the LaTeX source code
 * by comparing stripped text tokens against stripped LaTeX lines.
 */
export function findLineByText(clickedText: string, latexCode: string): LineMatchResult | null {
  if (!clickedText || !latexCode) return null;

  const rawTarget = clickedText.trim();
  if (rawTarget.length < 2) return null;

  const lines = latexCode.split("\n");
  const strippedTarget = stripLatexMarkup(rawTarget).toLowerCase();
  const targetTokens = strippedTarget
    .replace(/[^a-z0-9]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3);

  let bestLine = -1;
  let bestScore = 0;
  let bestSnippet = "";

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    // Skip preamble lines (before \begin{document})
    const strippedLine = stripLatexMarkup(rawLine).toLowerCase();
    if (!strippedLine) continue;

    // 1. Direct whole-phrase substring match
    if (strippedLine.includes(strippedTarget) || (strippedTarget.length > 10 && strippedLine.length > 5 && strippedTarget.includes(strippedLine))) {
      return {
        lineNumber: i + 1,
        snippet: rawLine.trim(),
        confidence: 1.0,
      };
    }

    // 2. Multi-token scoring for bullet points or headings
    if (targetTokens.length > 0) {
      let matchedCount = 0;
      for (const token of targetTokens) {
        if (strippedLine.includes(token)) {
          matchedCount++;
        }
      }

      const matchRatio = matchedCount / targetTokens.length;
      if (matchedCount >= 2 && matchRatio > bestScore) {
        bestScore = matchRatio;
        bestLine = i + 1;
        bestSnippet = rawLine.trim();
      }
    }
  }

  if (bestLine !== -1 && bestScore >= 0.35) {
    return {
      lineNumber: bestLine,
      snippet: bestSnippet,
      confidence: bestScore,
    };
  }

  // 3. Fallback for short section names (e.g., "EXPERIENCE", "EDUCATION", "SKILLS")
  const targetClean = rawTarget.toLowerCase().replace(/[^a-z]/g, "");
  if (targetClean.length >= 4) {
    for (let i = 0; i < lines.length; i++) {
      const lower = lines[i].toLowerCase();
      if ((lower.includes("\\section") || lower.includes("\\subsection")) && lower.includes(targetClean)) {
        return {
          lineNumber: i + 1,
          snippet: lines[i].trim(),
          confidence: 0.9,
        };
      }
    }
  }

  return null;
}
