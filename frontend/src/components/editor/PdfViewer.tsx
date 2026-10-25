"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { 
  Download, 
  FileText, 
  ZoomIn, 
  ZoomOut, 
  FileType, 
  AlertTriangle,
  RefreshCw,
  Scaling,
  ChevronDown,
  Code2,
  Columns
} from "lucide-react";
import { downloadBlob, downloadText, findLineByText } from "@/lib/latex-utils";
import { compileDocx } from "@/lib/api";

interface PdfLineGroup {
  top: number;
  bottom: number;
  centerY: number;
  text: string;
}

interface PdfViewerProps {
  pdfUrl: string | null;
  latexCode: string;
  isCompiling: boolean;
  errorLog: string | null;
  onRetry: () => void;
  onOpenScore?: () => void;
  atsScore?: number | null;
  onNavigateToLine?: (lineNumber: number, label: string) => void;
  viewMode?: "split" | "editor" | "preview";
  onViewModeChange?: (mode: "split" | "editor" | "preview") => void;
}

export default function PdfViewer({
  pdfUrl,
  latexCode,
  isCompiling,
  errorLog,
  onRetry,
  onOpenScore,
  atsScore,
  onNavigateToLine,
  viewMode,
  onViewModeChange,
}: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<any>(null);
  const renderSeqRef = useRef<number>(0);

  const [zoom, setZoom] = useState(100);
  const [isDownloadingWord, setIsDownloadingWord] = useState(false);
  const [isFitWidth, setIsFitWidth] = useState(false);
  const [pdfLines, setPdfLines] = useState<PdfLineGroup[]>([]);
  const [pageSize, setPageSize] = useState<{ width: number; height: number }>({ width: 612, height: 792 });
  const [isRenderingPdf, setIsRenderingPdf] = useState(false);
  const [activeHighlight, setActiveHighlight] = useState<{ top: number; height: number } | null>(null);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const downloadMenuRef = useRef<HTMLDivElement>(null);

  // Click-outside handler to dismiss download menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target as Node)) {
        setDownloadMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Initialize PDF.js worker
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("pdfjs-dist").then((pdfjsLib) => {
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
      });
    }
  }, []);

  // Crisp HiDPI Retina PDF Rendering onto Canvas
  const renderPdfPage = useCallback(async () => {
    if (!pdfUrl || !canvasContainerRef.current) return;

    // Increment render sequence ID for this invocation
    const currentSeq = ++renderSeqRef.current;

    try {
      setIsRenderingPdf(true);
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

      // If a newer render was requested while loading the library, abort
      if (currentSeq !== renderSeqRef.current) return;

      // Cancel any ongoing render task
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
          await renderTaskRef.current.promise.catch(() => {});
        } catch {
          // ignore cancel error
        }
        renderTaskRef.current = null;
      }

      if (currentSeq !== renderSeqRef.current || !canvasContainerRef.current) return;

      const loadingTask = pdfjsLib.getDocument({ url: pdfUrl });
      const pdfDoc = await loadingTask.promise;

      if (currentSeq !== renderSeqRef.current) return;

      const page = await pdfDoc.getPage(1);

      if (currentSeq !== renderSeqRef.current) return;

      // Retina / HiDPI Device Pixel Ratio (Minimum 2.0x for crisp Latin Modern text)
      const dpr = typeof window !== "undefined" ? Math.max(window.devicePixelRatio || 1, 2) : 2;
      const scale = zoom / 100;

      // Viewports
      const unscaledViewport = page.getViewport({ scale: 1.0 });
      setPageSize({ width: unscaledViewport.width, height: unscaledViewport.height });

      const cssViewport = page.getViewport({ scale });
      const renderViewport = page.getViewport({ scale: scale * dpr });

      // Create a fresh detached canvas for this render operation to eliminate canvas-reuse collisions
      const canvas = document.createElement("canvas");
      canvas.className = "block select-none pointer-events-none";
      canvas.width = Math.round(renderViewport.width);
      canvas.height = Math.round(renderViewport.height);
      canvas.style.width = `${Math.round(cssViewport.width)}px`;
      canvas.style.height = `${Math.round(cssViewport.height)}px`;

      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx || currentSeq !== renderSeqRef.current) return;

      // Fill pure white paper background prior to render to eliminate dark antialiasing fringing
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      const renderContext = {
        canvasContext: ctx,
        viewport: renderViewport,
      };

      const task = page.render(renderContext);
      renderTaskRef.current = task;
      await task.promise;

      if (renderTaskRef.current === task) {
        renderTaskRef.current = null;
      }

      // If this render is still the latest, mount the newly rendered canvas into the container
      if (currentSeq === renderSeqRef.current && canvasContainerRef.current) {
        canvasContainerRef.current.replaceChildren(canvas);
      } else {
        return;
      }

      // Extract text content and group into coherent text lines for SyncTeX
      const textContent = await page.getTextContent();
      const rawItems: Array<{ str: string; left: number; top: number; width: number; height: number }> = [];

      for (const item of textContent.items as any[]) {
        if (!item.str || !item.str.trim()) continue;
        const tx = pdfjsLib.Util.transform(cssViewport.transform, item.transform);
        const fontHeight = Math.sqrt(tx[2] * tx[2] + tx[3] * tx[3]);

        rawItems.push({
          str: item.str,
          left: tx[4],
          top: tx[5] - fontHeight,
          width: item.width * scale,
          height: fontHeight,
        });
      }

      // Sort top-to-bottom, left-to-right
      rawItems.sort((a, b) => {
        if (Math.abs(a.top - b.top) > 4) {
          return a.top - b.top;
        }
        return a.left - b.left;
      });

      // Group nearby items on the same vertical baseline into coherent lines
      const groups: PdfLineGroup[] = [];
      for (const it of rawItems) {
        const existing = groups.find((g) => Math.abs(g.centerY - (it.top + it.height / 2)) < 5);
        if (existing) {
          existing.text += " " + it.str;
          existing.top = Math.min(existing.top, it.top);
          existing.bottom = Math.max(existing.bottom, it.top + it.height);
          existing.centerY = (existing.top + existing.bottom) / 2;
        } else {
          groups.push({
            top: it.top,
            bottom: it.top + it.height,
            centerY: it.top + it.height / 2,
            text: it.str,
          });
        }
      }

      if (currentSeq === renderSeqRef.current) {
        setPdfLines(groups);
      }
    } catch (err: any) {
      if (
        err?.name === "RenderingCancelledException" ||
        err?.message?.includes("Cannot use the same canvas") ||
        err?.message?.includes("Rendering cancelled")
      ) {
        // Expected cancellation when a newer render takes precedence
        return;
      }
      console.error("PDF Render error:", err);
    } finally {
      if (currentSeq === renderSeqRef.current) {
        setIsRenderingPdf(false);
      }
    }
  }, [pdfUrl, zoom]);

  useEffect(() => {
    renderPdfPage();
    return () => {
      // Invalidate sequence so in-flight render aborts immediately
      renderSeqRef.current++;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {}
      }
    };
  }, [renderPdfPage]);

  // Fit Width logic: always ensures standard 100% on desktop, scales smoothly on mobile
  const handleFitWidth = () => {
    if (!containerRef.current || pageSize.width === 0) {
      setZoom(100);
      setIsFitWidth(true);
      return;
    }
    const padding = typeof window !== "undefined" && window.innerWidth < 640 ? 16 : 48;
    const availableWidth = containerRef.current.clientWidth - padding;
    if (availableWidth >= pageSize.width) {
      setZoom(100);
    } else if (availableWidth > 0) {
      const calculatedZoom = Math.min(100, Math.max(35, Math.floor((availableWidth / pageSize.width) * 100)));
      setZoom(calculatedZoom);
    } else {
      setZoom(100);
    }
    setIsFitWidth(true);
  };

  useEffect(() => {
    const handleResize = () => {
      if (isFitWidth) {
        handleFitWidth();
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isFitWidth, pageSize.width]);

  const handleZoomChange = (newZoom: number) => {
    setIsFitWidth(false);
    setZoom(Math.max(50, Math.min(200, newZoom)));
  };

  // Click-to-Source: click anywhere on the page jumps to the exact line in editor
  const handlePaperClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onNavigateToLine || pdfLines.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickY = e.clientY - rect.top;

    let closestLine: PdfLineGroup | null = null;
    let minDistance = Infinity;

    for (const line of pdfLines) {
      if (clickY >= line.top - 3 && clickY <= line.bottom + 3) {
        closestLine = line;
        break;
      }
      const dist = Math.abs(line.centerY - clickY);
      if (dist < minDistance) {
        minDistance = dist;
        closestLine = line;
      }
    }

    if (closestLine && closestLine.text.trim()) {
      // Trigger a sleek momentary highlight pulse on this line
      setActiveHighlight({
        top: Math.max(0, closestLine.top - 2),
        height: Math.max(16, closestLine.bottom - closestLine.top + 4),
      });
      setTimeout(() => setActiveHighlight(null), 600);

      const match = findLineByText(closestLine.text, latexCode);
      if (match) {
        onNavigateToLine(match.lineNumber, match.snippet);
      }
    }
  };

  const handleDownloadPdf = () => {
    if (!pdfUrl) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = "Resume.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadWord = async () => {
    try {
      setIsDownloadingWord(true);
      const docxBlob = await compileDocx(latexCode, "Resume");
      downloadBlob(docxBlob, "Resume.docx");
    } catch (e) {
      alert("Word export failed: " + e);
    } finally {
      setIsDownloadingWord(false);
    }
  };

  const handleDownloadTex = () => {
    downloadText(latexCode, "Resume.tex");
  };

  const displayWidth = Math.round((pageSize.width * zoom) / 100);
  const displayHeight = Math.round((pageSize.height * zoom) / 100);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl">
      {/* PDF Header Controls */}
      <div className="flex flex-wrap min-h-10 items-center justify-between border-b border-zinc-800/80 bg-zinc-900/60 px-3 py-1.5 gap-2 text-xs">
        {/* Left: View Switcher (Restores split/editor from full preview) + Zoom Controls */}
        <div className="flex items-center gap-1.5">
          {onViewModeChange && (
            <div className="flex items-center rounded-md border border-zinc-800 bg-zinc-950 p-0.5">
              <button
                onClick={() => onViewModeChange("editor")}
                className={`p-1 rounded transition-colors ${
                  viewMode === "editor" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                }`}
                title="Code Editor only"
              >
                <Code2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onViewModeChange("split")}
                className={`p-1 rounded transition-colors ${
                  viewMode === "split" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                }`}
                title="Split View"
              >
                <Columns className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onViewModeChange("preview")}
                className={`p-1 rounded transition-colors ${
                  viewMode === "preview" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                }`}
                title="PDF Preview only"
              >
                <FileText className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <div className="flex items-center rounded-md border border-zinc-800 bg-zinc-900/90 p-0.5">
            <button
              onClick={() => handleZoomChange(zoom - 10)}
              className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors touch-manipulation"
              title="Zoom out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="px-1.5 font-mono text-[11px] text-zinc-300 select-none min-w-[34px] text-center">
              {zoom}%
            </span>
            <button
              onClick={() => handleZoomChange(zoom + 10)}
              className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors touch-manipulation"
              title="Zoom in"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            onClick={handleFitWidth}
            className={`flex items-center justify-center rounded-md border p-1.5 transition-colors touch-manipulation ${
              isFitWidth
                ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-300"
                : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white"
            }`}
            title="Fit to Width"
          >
            <Scaling className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Right: Recompile & Download (Pure Icons) */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onRetry}
            disabled={isCompiling}
            className="flex items-center justify-center rounded-md border border-zinc-800 bg-zinc-900/90 p-1.5 text-zinc-400 hover:border-emerald-500/40 hover:bg-zinc-800 hover:text-emerald-400 transition-all disabled:opacity-40 shadow-sm touch-manipulation"
            title="Recompile Resume (⌘S)"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isCompiling ? "animate-spin text-emerald-400" : ""}`} />
          </button>

          <div className="relative" ref={downloadMenuRef}>
            <button
              onClick={() => setDownloadMenuOpen(!downloadMenuOpen)}
              disabled={!pdfUrl || isCompiling}
              className="flex items-center gap-1 rounded-md bg-emerald-500/15 border border-emerald-500/40 px-2 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25 transition-all disabled:opacity-40 shadow-sm touch-manipulation"
              title="Download formats (.pdf, .docx, .tex)"
            >
              <Download className="h-3.5 w-3.5 text-emerald-400" />
              <ChevronDown className="h-3 w-3 opacity-70" />
            </button>

          {downloadMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 z-50 w-52 rounded-xl border border-zinc-800 bg-zinc-950/95 p-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95">
              <button
                onClick={() => {
                  handleDownloadPdf();
                  setDownloadMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-zinc-900 transition-colors group"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
                  <Download className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-200 group-hover:text-emerald-400 transition-colors">
                    PDF Document (.pdf)
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono">
                    Retina compiled print PDF
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  handleDownloadWord();
                  setDownloadMenuOpen(false);
                }}
                disabled={isDownloadingWord}
                className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-zinc-900 transition-colors group disabled:opacity-50"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-500/10 border border-blue-500/30 text-blue-400 shrink-0">
                  <FileType className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-200 group-hover:text-blue-400 transition-colors">
                    Word Document (.docx)
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono">
                    {isDownloadingWord ? "Exporting..." : "ATS recruiter format"}
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  handleDownloadTex();
                  setDownloadMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-zinc-900 transition-colors group"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
                  <FileText className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-200 group-hover:text-amber-400 transition-colors">
                    LaTeX Source (.tex)
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono">
                    Pure compilable markup
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>

      {/* PDF Viewport with Crisp Canvas & Click-to-Source Text Layer */}
      <div
        ref={containerRef}
        className="relative flex-1 overflow-x-auto overflow-y-auto bg-zinc-900/80 p-2 sm:p-6 touch-pan-x touch-pan-y"
        style={{
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* Loading overlay */}
        {(isCompiling || isRenderingPdf) && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-zinc-950/60 backdrop-blur-sm">
            <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/95 px-4 py-2.5 shadow-xl">
              <RefreshCw className="h-4 w-4 animate-spin text-emerald-400" />
              <span className="text-xs font-medium text-zinc-200">
                {isCompiling ? "Compiling with Tectonic..." : "Rendering Retina PDF..."}
              </span>
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

        {/* Crisp Document Paper with Clickable Text SyncTeX */}
        {pdfUrl && !errorLog && (
          <div className="min-w-full w-max flex justify-center py-2 px-2">
            <div
              onClick={handlePaperClick}
              onDoubleClick={handlePaperClick}
              style={{
                width: `${displayWidth}px`,
                height: `${displayHeight}px`,
              }}
              className="relative shadow-[0_10px_35px_rgba(0,0,0,0.5),0_2px_10px_rgba(0,0,0,0.25)] rounded-sm border border-zinc-700/60 bg-white shrink-0 cursor-text select-text overflow-hidden transition-shadow"
              title="Click or double-click any line to jump directly to it in the editor"
            >
              {/* Retina HiDPI Canvas Container */}
              <div
                ref={canvasContainerRef}
                className="block select-none pointer-events-none"
              />

              {/* SyncTeX Click Indicator Flash */}
              {activeHighlight && (
                <div
                  style={{
                    top: `${activeHighlight.top}px`,
                    height: `${activeHighlight.height}px`,
                    left: 0,
                    right: 0,
                  }}
                  className="pointer-events-none absolute bg-emerald-500/15 border-l-4 border-emerald-500 transition-all duration-300 ease-out animate-pulse"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
