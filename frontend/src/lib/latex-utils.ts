/**
 * Client-side utility for LaTeX cleaning, validation, and SyncTeX click-to-source mapping
 */

export function cleanLatex(code: string): { cleaned: string; emDashesReplaced: number } {
  let count = 0;
  const emDashRegex = /—/g;
  const matches = code.match(emDashRegex);
  if (matches) {
    count = matches.length;
  }
  // Replace em-dash with LaTeX en-dash '--'
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

export interface LatexAnchor {
  label: string;
  category: "header" | "education" | "experience" | "projects" | "skills" | "item";
  lineNumber: number;
  relativeY: number; // 0.0 to 1.0 approx vertical position on a standard 1-page resume
}

export function parseLatexAnchors(code: string): LatexAnchor[] {
  const lines = code.split("\n");
  const anchors: LatexAnchor[] = [];

  let currentSection = "header";
  let expCount = 0;
  let projCount = 0;

  lines.forEach((rawLine, idx) => {
    const lineNum = idx + 1;
    const line = rawLine.trim();

    if (line.includes("\\begin{center}") || line.includes("\\textbf{\\Huge")) {
      anchors.push({ label: "Header & Contact", category: "header", lineNumber: lineNum, relativeY: 0.05 });
    } else if (line.includes("\\section{Education}")) {
      currentSection = "education";
      anchors.push({ label: "Education", category: "education", lineNumber: lineNum, relativeY: 0.14 });
    } else if (line.includes("\\section{Experience}")) {
      currentSection = "experience";
      anchors.push({ label: "Experience", category: "experience", lineNumber: lineNum, relativeY: 0.22 });
    } else if (line.includes("\\section{Projects}")) {
      currentSection = "projects";
      anchors.push({ label: "Projects", category: "projects", lineNumber: lineNum, relativeY: 0.68 });
    } else if (line.includes("\\section{Technical Skills}")) {
      currentSection = "skills";
      anchors.push({ label: "Technical Skills", category: "skills", lineNumber: lineNum, relativeY: 0.88 });
    } else if (line.startsWith("\\resumeSubheading")) {
      const matches = line.match(/\{([^}]+)\}/g);
      const title = matches && matches.length >= 1 ? matches[0].replace(/[{}]/g, "") : "Position";
      const org = matches && matches.length >= 3 ? matches[2].replace(/[{}]/g, "") : "";
      const label = org ? `${org}` : title;

      let calculatedY = 0.25;
      if (currentSection === "experience") {
        expCount++;
        calculatedY = 0.22 + expCount * 0.13;
      } else if (currentSection === "projects") {
        projCount++;
        calculatedY = 0.68 + projCount * 0.09;
      }

      anchors.push({
        label,
        category: currentSection as any,
        lineNumber: lineNum,
        relativeY: Math.min(0.95, calculatedY),
      });
    }
  });

  return anchors;
}

export function findLineFromClickRatio(ratio: number, anchors: LatexAnchor[], totalLines: number): { lineNumber: number; label: string } {
  if (!anchors || anchors.length === 0) {
    return { lineNumber: Math.max(1, Math.min(totalLines, Math.round(ratio * totalLines))), label: "Code Section" };
  }

  let closest = anchors[0];
  let minDiff = Math.abs(ratio - closest.relativeY);

  for (let i = 1; i < anchors.length; i++) {
    const diff = Math.abs(ratio - anchors[i].relativeY);
    if (diff < minDiff) {
      minDiff = diff;
      closest = anchors[i];
    }
  }

  return { lineNumber: closest.lineNumber, label: closest.label };
}
