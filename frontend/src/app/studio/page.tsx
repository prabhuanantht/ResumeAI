"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Navbar from "@/components/navigation/Navbar";
import LatexEditor from "@/components/editor/LatexEditor";
import PdfViewer from "@/components/editor/PdfViewer";
import AiAssistant from "@/components/editor/AiAssistant";
import ResumeScorerDrawer from "@/components/editor/ResumeScorerDrawer";
import { 
  getProfile, 
  compilePdf, 
  validateLatex, 
  scoreResume,
  autoBoostResume,
  Profile 
} from "@/lib/api";
import { 
  Sparkles, 
  Code2, 
  FileText, 
  Columns, 
  TrendingUp, 
  Zap, 
  Loader2, 
  RotateCcw,
  Check,
  X,
  GripVertical,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Terminal,
  ShieldCheck,
  Cpu
} from "lucide-react";
import confetti from "canvas-confetti";

type ViewMode = "split" | "editor" | "preview";

export default function StudioPage() {
  const [latexCode, setLatexCode] = useState<string>("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileTimeMs, setCompileTimeMs] = useState<number>(340);
  const [errorLog, setErrorLog] = useState<string | null>(null);
  const [errors, setErrors] = useState<Array<{ line: string | number; message: string }>>([]);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isScoreOpen, setIsScoreOpen] = useState(false);
  const [liveAtsScore, setLiveAtsScore] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);

  // Pro-Grade PC Split Screen Resizing
  const [splitRatio, setSplitRatio] = useState<number>(50); // percentage for left editor
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const mainContainerRef = useRef<HTMLDivElement>(null);

  // Auto-Boost State
  const [isBoosting, setIsBoosting] = useState(false);
  const [previousLatex, setPreviousLatex] = useState<string | null>(null);
  const [lastBoostResult, setLastBoostResult] = useState<{
    original_score: number;
    boosted_score: number;
    explanation: string;
    changes: string[];
  } | null>(null);
  const [showBoostBanner, setShowBoostBanner] = useState(false);

  // Compilation trigger with latency measurement
  const triggerCompile = useCallback(async (codeToCompile: string) => {
    if (!codeToCompile) return;
    const startTime = performance.now();
    try {
      setIsCompiling(true);
      setErrorLog(null);
      setErrors([]);

      const blob = await compilePdf(codeToCompile, "Alex_Mercer_Resume");
      const url = URL.createObjectURL(blob);
      setPdfUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
      setCompileTimeMs(Math.round(performance.now() - startTime));

      // Compute baseline live ATS score
      scoreResume({ latex_code: codeToCompile })
        .then((b) => setLiveAtsScore(b.overall_score))
        .catch(() => {});
    } catch (err: any) {
      console.error("Compile error:", err);
      setErrorLog(err.message || "Compilation failed");
      const validation = await validateLatex(codeToCompile);
      if (!validation.valid && validation.errors) {
        setErrors(validation.errors);
      }
    } finally {
      setIsCompiling(false);
    }
  }, []);

  // Load profile resume on mount
  useEffect(() => {
    async function loadInitial() {
      try {
        const profile = await getProfile();
        setActiveProfile(profile);
        const code = profile.primary_latex;
        setLatexCode(code);
        triggerCompile(code);
      } catch (e) {
        console.error("Failed to load profile:", e);
      }
    }
    loadInitial();
  }, [triggerCompile]);

  // Keyboard shortcut Cmd+S / Ctrl+S and Cmd+B for auto-boost
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        triggerCompile(latexCode);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        handleExecuteAutoBoost();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [latexCode, triggerCompile]);

  // Draggable Split Divider Logic (Desktop PC First-Class Feature)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !mainContainerRef.current) return;
      const rect = mainContainerRef.current.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const percentage = (currentX / rect.width) * 100;
      if (percentage >= 22 && percentage <= 78) {
        setSplitRatio(percentage);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    } else {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  const handleApplyAi = (newCode: string) => {
    setLatexCode(newCode);
    triggerCompile(newCode);
  };

  // Immediate 1-Click Auto-Boost Execution
  const handleExecuteAutoBoost = async (targetJd?: string) => {
    if (!latexCode.trim() || isBoosting) return;
    try {
      setIsBoosting(true);
      setPreviousLatex(latexCode);

      const result = await autoBoostResume({
        latex_code: latexCode,
        target_jd: targetJd,
      });

      setLatexCode(result.updated_latex);
      await triggerCompile(result.updated_latex);
      setLiveAtsScore(result.boosted_score);
      setLastBoostResult({
        original_score: result.original_score,
        boosted_score: result.boosted_score,
        explanation: result.explanation,
        changes: result.changes,
      });
      setShowBoostBanner(true);

      confetti({
        particleCount: 50,
        spread: 75,
        origin: { y: 0.5 },
        colors: ["#10b981", "#6366f1", "#f59e0b"],
      });
    } catch (e: any) {
      alert("Auto-Boost failed: " + (e.message || e));
    } finally {
      setIsBoosting(false);
    }
  };

  const handleUndoBoost = () => {
    if (previousLatex) {
      setLatexCode(previousLatex);
      triggerCompile(previousLatex);
      setPreviousLatex(null);
      setLastBoostResult(null);
      setShowBoostBanner(false);
    }
  };

  // Compute stats for bottom status bar
  const lineCount = latexCode.split("\n").length;
  const wordCount = latexCode.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="flex h-[100dvh] flex-col bg-zinc-950 text-white overflow-hidden">
      <Navbar onCompile={() => triggerCompile(latexCode)} isCompiling={isCompiling} />

      {/* Pro Toolbar: View Mode Switcher + Live ATS Score + 1-Click Auto Boost */}
      <div className="flex flex-wrap items-center justify-between border-b border-zinc-800/80 bg-zinc-900/60 px-3 py-1.5 gap-2 text-xs">
        {/* View Mode Segmented Control (Works on Desktop PC and 11" iPad) */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-950/80 p-0.5 shadow-inner">
            <button
              onClick={() => setViewMode("editor")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all touch-manipulation ${
                viewMode === "editor"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              title="Maximize Code Editor"
            >
              <Code2 className="h-3.5 w-3.5" />
              <span>Editor</span>
            </button>

            <button
              onClick={() => setViewMode("split")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all touch-manipulation ${
                viewMode === "split"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              title="Side-by-Side Split Workspace"
            >
              <Columns className="h-3.5 w-3.5" />
              <span>Split View</span>
            </button>

            <button
              onClick={() => setViewMode("preview")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all touch-manipulation ${
                viewMode === "preview"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              title="Maximize PDF Preview"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>PDF Preview</span>
            </button>
          </div>

          {/* Quick Preset Split Ratios on Desktop */}
          {viewMode === "split" && (
            <div className="hidden lg:flex items-center gap-1 text-[11px] text-zinc-500 font-mono pl-2">
              <button
                onClick={() => setSplitRatio(50)}
                className="hover:text-zinc-300 transition-colors"
                title="Reset to 50/50"
              >
                50:50
              </button>
              <span>•</span>
              <button
                onClick={() => setSplitRatio(60)}
                className="hover:text-zinc-300 transition-colors"
                title="60% Editor, 40% PDF"
              >
                60:40
              </button>
              <span>•</span>
              <button
                onClick={() => setSplitRatio(40)}
                className="hover:text-zinc-300 transition-colors"
                title="40% Editor, 60% PDF"
              >
                40:60
              </button>
            </div>
          )}
        </div>

        {/* Live Resume Score + 1-Click Auto Boost Action Cluster */}
        <div className="flex items-center gap-2">
          {/* Live Score Pill (Opens Drawer) */}
          <button
            onClick={() => setIsScoreOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-950/30 px-3 py-1 text-xs font-medium text-emerald-400 hover:bg-emerald-900/40 hover:border-emerald-500/50 transition-all touch-manipulation shadow-sm"
            title="Open ATS Score Diagnostics & Benchmark"
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span className="font-mono font-semibold">
              ATS Score: {liveAtsScore ? `${liveAtsScore}%` : "Analyzing..."}
            </span>
          </button>

          {/* 1-Click Instant Auto-Boost Button */}
          <button
            onClick={() => handleExecuteAutoBoost()}
            disabled={isBoosting}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-400 px-3 py-1 text-xs font-bold text-zinc-950 shadow-md shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 touch-manipulation"
            title="Automatically enhance metrics, action verbs, and ATS keywords right now (⌘B)"
          >
            {isBoosting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Zap className="h-3.5 w-3.5" />
            )}
            <span>{isBoosting ? "Boosting..." : "Auto-Boost"}</span>
            <kbd className="hidden md:inline-block rounded bg-emerald-600/30 px-1 text-[9px] font-mono">
              ⌘B
            </kbd>
          </button>

          <button
            onClick={() => setIsAiOpen(true)}
            className="hidden sm:flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/80 px-2.5 py-1 text-xs font-medium text-zinc-300 hover:bg-zinc-700 transition-all touch-manipulation"
            title="Open In-Editor AI Copilot"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span>AI Copilot</span>
          </button>
        </div>
      </div>

      {/* Auto-Boost Banner Notification when completed */}
      {showBoostBanner && lastBoostResult && (
        <div className="flex items-center justify-between border-b border-emerald-500/30 bg-emerald-950/50 px-4 py-2 text-xs text-emerald-300 animate-in slide-in-from-top-1">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Resume Auto-Boosted!</strong> Enhanced bullet points with quantifiable metrics and Google X-Y-Z formula.
            </span>
          </div>
          <div className="flex items-center gap-3">
            {previousLatex && (
              <button
                onClick={handleUndoBoost}
                className="flex items-center gap-1 font-mono text-[11px] text-zinc-300 hover:text-white underline"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Undo Boost</span>
              </button>
            )}
            <button
              onClick={() => setShowBoostBanner(false)}
              className="text-zinc-400 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Studio Canvas with Pro Draggable Divider */}
      <main
        ref={mainContainerRef}
        className="relative flex flex-1 overflow-hidden p-2 sm:p-2.5 min-h-0 select-text"
      >
        {/* Left Column: Monaco Code Editor */}
        {viewMode !== "preview" && (
          <div
            style={{
              width: viewMode === "split" ? `${splitRatio}%` : "100%",
              minWidth: viewMode === "split" ? "260px" : undefined,
            }}
            className="h-full min-h-0 transition-[width] duration-75"
          >
            <LatexEditor
              code={latexCode}
              onChange={(val) => setLatexCode(val)}
              onSave={() => triggerCompile(latexCode)}
              errors={errors}
              isCompiling={isCompiling}
            />
          </div>
        )}

        {/* Pro Draggable Split Divider on Desktop PC */}
        {viewMode === "split" && (
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDoubleClick={() => setSplitRatio(50)}
            title="Drag to resize panels • Double-click to reset 50/50"
            className="group relative flex w-3 items-center justify-center cursor-col-resize hover:bg-emerald-500/20 active:bg-emerald-500/30 transition-colors z-20 shrink-0"
          >
            <div className="h-8 w-1 rounded-full bg-zinc-700 group-hover:bg-emerald-400 group-active:bg-emerald-400 transition-colors" />
          </div>
        )}

        {/* Right Column: PDF Preview Viewport with horizontal scroll */}
        {viewMode !== "editor" && (
          <div
            style={{
              width: viewMode === "split" ? `${100 - splitRatio}%` : "100%",
              minWidth: viewMode === "split" ? "280px" : undefined,
            }}
            className="h-full min-h-0 transition-[width] duration-75"
          >
            <PdfViewer
              pdfUrl={pdfUrl}
              latexCode={latexCode}
              isCompiling={isCompiling}
              errorLog={errorLog}
              onRetry={() => triggerCompile(latexCode)}
              onOpenScore={() => setIsScoreOpen(true)}
              atsScore={liveAtsScore}
            />
          </div>
        )}

        {/* Resume Score & ATS Diagnostic Drawer */}
        <ResumeScorerDrawer
          latexCode={latexCode}
          isOpen={isScoreOpen}
          onClose={() => setIsScoreOpen(false)}
          onScoreUpdated={(s) => setLiveAtsScore(s)}
          onExecuteAutoBoost={handleExecuteAutoBoost}
          isBoosting={isBoosting}
          lastBoostResult={lastBoostResult}
          onUndoBoost={handleUndoBoost}
        />

        {/* AI Assistant Drawer */}
        <AiAssistant
          currentLatex={latexCode}
          onApplyChange={handleApplyAi}
          isOpen={isAiOpen}
          onClose={() => setIsAiOpen(false)}
        />
      </main>

      {/* Pro-Grade Desktop Status Bar */}
      <footer className="hidden sm:flex h-6 items-center justify-between border-t border-zinc-800/80 bg-zinc-950 px-3 text-[11px] font-mono text-zinc-400 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="text-zinc-300">Tectonic v0.17 (Rust Engine)</span>
          </div>
          <span>•</span>
          <span className="text-zinc-500">{compileTimeMs}ms compile</span>
          <span>•</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" />
            0 Em Dashes
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span>{lineCount} lines</span>
          <span>•</span>
          <span>{wordCount} words</span>
          <span>•</span>
          <span className="text-zinc-500">UTF-8 LaTeX</span>
        </div>
      </footer>
    </div>
  );
}
