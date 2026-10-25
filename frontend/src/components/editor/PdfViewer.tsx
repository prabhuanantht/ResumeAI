"use client";

import React, { useState } from "react";
import { 
  Download, 
  FileText, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCw, 
  FileType, 
  Check, 
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { downloadBlob, downloadText } from "@/lib/latex-utils";
import { compileDocx } from "@/lib/api";

interface PdfViewerProps {
  pdfUrl: string | null;
  latexCode: string;
  isCompiling: boolean;
  errorLog: string | null;
  onRetry: () => void;
}

export default function PdfViewer({
  pdfUrl,
  latexCode,
  isCompiling,
  errorLog,
  onRetry,
}: PdfViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [isDownloadingWord, setIsDownloadingWord] = useState(false);

  const handleDownloadPdf = () => {
    if (!pdfUrl) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = "Alex_Mercer_Resume.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadWord = async () => {
    try {
      setIsDownloadingWord(true);
      const docxBlob = await compileDocx(latexCode, "Alex_Mercer_Resume");
      downloadBlob(docxBlob, "Alex_Mercer_Resume.docx");
    } catch (e) {
      alert("Word export failed: " + e);
    } finally {
      setIsDownloadingWord(false);
    }
  };

  const handleDownloadTex = () => {
    downloadText(latexCode, "Alex_Mercer_Resume.tex");
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl">
      {/* PDF Header Controls */}
      <div className="flex h-10 items-center justify-between border-b border-zinc-800/80 bg-zinc-900/60 px-4 text-xs">
        {/* Left: View Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border border-zinc-800 bg-zinc-900/90 p-0.5">
            <button
              onClick={() => setZoom((z) => Math.max(50, z - 10))}
              className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="px-2 font-mono text-[11px] text-zinc-300">{zoom}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(180, z + 10))}
              className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>
          <button
            onClick={() => setZoom(100)}
            className="hidden sm:inline-flex rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-[11px] font-mono text-zinc-400 hover:text-white transition-colors"
          >
            Reset
          </button>
        </div>

        {/* Right: Export Downloads Cluster */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPdf}
            disabled={!pdfUrl || isCompiling}
            className="flex items-center gap-1.5 rounded bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition-all disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" />
            <span>PDF</span>
          </button>

          <button
            onClick={handleDownloadWord}
            disabled={isDownloadingWord || isCompiling}
            className="flex items-center gap-1.5 rounded border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition-all disabled:opacity-40"
          >
            <FileType className="h-3.5 w-3.5 text-blue-400" />
            <span>{isDownloadingWord ? "..." : "Word"}</span>
          </button>

          <button
            onClick={handleDownloadTex}
            className="hidden sm:flex items-center gap-1.5 rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs font-medium text-zinc-400 hover:text-white transition-all"
          >
            <FileText className="h-3.5 w-3.5 text-amber-400" />
            <span>.tex</span>
          </button>
        </div>
      </div>

      {/* PDF Viewport */}
      <div className="relative flex-1 overflow-auto bg-zinc-900/50 p-4 sm:p-6 flex items-start justify-center">
        {/* Loading overlay */}
        {isCompiling && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-950/70 backdrop-blur-sm">
            <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/90 px-4 py-2.5 shadow-xl">
              <RefreshCw className="h-4 w-4 animate-spin text-emerald-400" />
              <span className="text-xs font-medium text-zinc-200">Compiling TeX with Tectonic...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {errorLog && !isCompiling && (
          <div className="m-auto max-w-lg rounded-xl border border-rose-500/30 bg-rose-950/40 p-6 text-center backdrop-blur">
            <AlertTriangle className="mx-auto h-8 w-8 text-rose-400" />
            <h4 className="mt-3 text-sm font-semibold text-rose-200">LaTeX Compilation Error</h4>
            <p className="mt-1 text-xs text-rose-300/80">
              There was a syntax or package error while rendering the PDF.
            </p>
            <pre className="mt-3 max-h-40 overflow-auto rounded bg-zinc-950/80 p-3 text-left font-mono text-[11px] text-rose-200/90">
              {errorLog}
            </pre>
            <button
              onClick={onRetry}
              className="mt-4 rounded-md bg-rose-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-400 transition-colors"
            >
              Try Recompiling
            </button>
          </div>
        )}

        {/* PDF Document Container */}
        {pdfUrl && !errorLog && (
          <div
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
            className="transition-transform duration-150 ease-out shadow-2xl rounded-sm overflow-hidden border border-zinc-800 bg-white"
          >
            <iframe
              src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
              title="Resume Preview"
              className="h-[1050px] w-[810px] bg-white border-none block"
            />
          </div>
        )}
      </div>
    </div>
  );
}
