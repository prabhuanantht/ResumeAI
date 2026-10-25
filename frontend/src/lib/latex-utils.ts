/**
 * Client-side utility for LaTeX cleaning and validation
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
