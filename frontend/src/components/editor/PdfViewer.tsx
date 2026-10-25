"use client";

import React, { useState, useRef, useEffect } from "react";
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
  RefreshCw,
  Scaling,
  Move
} from "lucide-react";
import { downloadBlob, downloadText } from "@/lib/latex-utils";
import { compileDocx } from "@/lib/api";

interface PdfViewerProps {
  pdfUrl: string | null;
  latexCode: string;
  isCompiling: boolean;
  errorLog: string | null;
  onRetry: () => void;
  onOpenScore?: () => void;
  atsScore?: number | null;
}

const BASE_WIDTH = 810;
const BASE_HEIGHT = 1050;

export default function PdfViewer({
  pdfUrl,
  latexCode,
  isCompiling,
  errorLog,
  onRetry,
  onOpenScore,
  atsScore,
}: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(100);
  const [isDownloadingWord, setIsDownloadingWord] = useState(false);
  const [isFitWidth, setIsFitWidth] = useState(false);

  // Fit Width logic: responsive to 11-inch iPad (834px portrait / 1194px landscape)
  const handleFitWidth = () => {
    if (!containerRef.current) return;
    const availableWidth = containerRef.current.clientWidth - 32; // minus padding
    if (availableWidth > 0) {
      const calculatedZoom = Math.min(180, Math.max(40, Math.floor((availableWidth / BASE_WIDTH) * 100)));
      setZoom(calculatedZoom);
      setIsFitWidth(true);
    }
  };

  // Auto-fit on small screens or 11" iPads on mount/resize if desired
  useEffect(() => {
    const handleResize = () => {
      if (isFitWidth && containerRef.current) {
        handleFitWidth();
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isFitWidth]);

  const handleZoomChange = (newZoom: number) => {
    setIsFitWidth(false);
    setZoom(Math.max(40, Math.min(200, newZoom)));
  };

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

  const scaledWidth = (BASE_WIDTH * zoom) / 100;
  const scaledHeight = (BASE_HEIGHT * zoom) / 100;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl">
      {/* PDF Header Controls */}
      <div className="flex flex-wrap min-h-10 items-center justify-between border-b border-zinc-800/80 bg-zinc-900/60 px-3 py-1.5 gap-2 text-xs">
        {/* Left: View Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex items-center rounded-md border border-zinc-800 bg-zinc-900/90 p-0.5">
            <button
              onClick={() => handleZoomChange(zoom - 10)}
              className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors touch-manipulation"
              title="Zoom out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="px-2 font-mono text-[11px] text-zinc-300 select-none">
              {zoom}%
            </span>
            <button
              onClick={() => handleZoomChange(zoom + 10)}
              className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors touch-manipulation"
              title="Zoom in"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            onClick={handleFitWidth}
            className={`flex items-center gap-1 rounded border px-2 py-1 text-[11px] font-mono transition-colors touch-manipulation ${
              isFitWidth
                ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-300"
                : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white"
            }`}
            title="Fit PDF to Available Width"
          >
            <Scaling className="h-3 w-3" />
            <span>Fit Width</span>
          </button>

          <button
            onClick={() => handleZoomChange(100)}
            className="hidden sm:inline-flex rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-[11px] font-mono text-zinc-400 hover:text-white transition-colors touch-manipulation"
          >
            100%
          </button>

          {/* Quick Score Trigger in Preview Header if available */}
          {onOpenScore && (
            <button
              onClick={onOpenScore}
              className="flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-950/20 px-2 py-1 text-[11px] font-mono text-emerald-400 hover:bg-emerald-900/30 transition-colors"
            >
              <span className="font-semibold">Score:</span>
              <span>{atsScore ? `${atsScore}%` : "Analyze"}</span>
            </button>
          )}
        </div>

        {/* Right: Export Downloads Cluster */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={handleDownloadPdf}
            disabled={!pdfUrl || isCompiling}
            className="flex items-center gap-1.5 rounded bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition-all disabled:opacity-40 touch-manipulation"
          >
            <Download className="h-3.5 w-3.5" />
            <span>PDF</span>
          </button>

          <button
            onClick={handleDownloadWord}
            disabled={isDownloadingWord || isCompiling}
            className="flex items-center gap-1.5 rounded border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition-all disabled:opacity-40 touch-manipulation"
          >
            <FileType className="h-3.5 w-3.5 text-blue-400" />
            <span>{isDownloadingWord ? "..." : "Word"}</span>
          </button>

          <button
            onClick={handleDownloadTex}
            className="hidden sm:flex items-center gap-1.5 rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs font-medium text-zinc-400 hover:text-white transition-all touch-manipulation"
          >
            <FileText className="h-3.5 w-3.5 text-amber-400" />
            <span>.tex</span>
          </button>
        </div>
      </div>

      {/* PDF Viewport with Full Horizontal and Vertical Scroll Support */}
      <div
        ref={containerRef}
        className="relative flex-1 overflow-x-auto overflow-y-auto bg-zinc-900/60 p-3 sm:p-6 touch-pan-x touch-pan-y"
        style={{
          WebkitOverflowScrolling: "touch",
        }}
      >
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

        {/* Scroll Container: Uses min-w-full & w-max so horizontal scrolling works in both directions without clipping! */}
        {pdfUrl && !errorLog && (
          <div className="min-w-full w-max flex justify-center py-2 px-2">
            <div
              style={{
                width: `${scaledWidth}px`,
                height: `${scaledHeight}px`,
              }}
              className="relative transition-all duration-150 ease-out shadow-2xl rounded-sm overflow-hidden border border-zinc-800 bg-white shrink-0"
            >
              <iframe
                src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                title="Resume Preview"
                style={{
                  width: `${BASE_WIDTH}px`,
                  height: `${BASE_HEIGHT}px`,
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: "top left",
                }}
                className="bg-white border-none block"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
