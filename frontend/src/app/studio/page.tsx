"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Navbar from "@/components/navigation/Navbar";
import LatexEditor from "@/components/editor/LatexEditor";
import PdfViewer from "@/components/editor/PdfViewer";
import AiAssistant from "@/components/editor/AiAssistant";
import ResumeScorerDrawer from "@/components/editor/ResumeScorerDrawer";
import ApiKeyModal from "@/components/settings/ApiKeyModal";
import { 
  getProfile, 
  compilePdf, 
  validateLatex, 
  scoreResume,
  autoBoostResume,
  getStoredApiKey,
  getStoredDraft,
  setStoredDraft,
  getStoredTargetJd,
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

  // SyncTeX Click-to-Source Line Navigation
  const [targetLine, setTargetLine] = useState<number | null>(null);
  const [targetLabel, setTargetLabel] = useState<string | null>(null);

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

  // Local Storage Autosave & API Key Status
  const [lastSavedTime, setLastSavedTime] = useState<string>("");
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState<boolean>(false);
  const [showKeyBanner, setShowKeyBanner] = useState<boolean>(true);
  const [targetJd, setTargetJd] = useState<string>("");

  // Check API key configuration on mount
  useEffect(() => {
    const key = getStoredApiKey();
    setHasApiKey(Boolean(key));
    const savedJd = getStoredTargetJd();
    if (savedJd) setTargetJd(savedJd);
  }, []);

  // Autosave LaTeX draft to client localStorage
  useEffect(() => {
    if (!latexCode || latexCode.trim().length === 0) return;
    const timer = setTimeout(() => {
      setStoredDraft(latexCode);
      const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setLastSavedTime(timeStr);
    }, 700);
    return () => clearTimeout(timer);
  }, [latexCode]);

  // Compilation trigger with latency measurement
  const triggerCompile = useCallback(async (codeToCompile: string) => {
    if (!codeToCompile) return;
    const startTime = performance.now();
    try {
      setIsCompiling(true);
      setErrorLog(null);
      setErrors([]);

      const blob = await compilePdf(codeToCompile, "Resume");
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

  // Load draft from local cache or server profile on mount
  useEffect(() => {
    async function loadInitial() {
      try {
        const cachedDraft = getStoredDraft();
        if (cachedDraft && cachedDraft.trim().length > 60) {
          setLatexCode(cachedDraft);
          triggerCompile(cachedDraft);
          setLastSavedTime("Restored");
          return;
        }

        const profile = await getProfile();
        setActiveProfile(profile);
        const code = profile.primary_latex;
        setLatexCode(code);
        triggerCompile(code);
      } catch (e) {
        console.error("Failed to load initial resume:", e);
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

  const handleApplyAi = (newCode: string, label?: string) => {
    setPreviousLatex(latexCode);
    setLatexCode(newCode);
    triggerCompile(newCode);
  };

  const handleUndoAi = (previousCode: string) => {
    setLatexCode(previousCode);
    triggerCompile(previousCode);
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

  // SyncTeX Click-to-Source Navigation Handler
  const handleNavigateToLine = (lineNumber: number, label: string) => {
    setTargetLine(lineNumber);
    setTargetLabel(label);
    if (viewMode === "preview") {
      setViewMode("split");
    }
  };

  // Compute stats for bottom status bar
  const lineCount = latexCode.split("\n").length;
  const wordCount = latexCode.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="flex h-[100dvh] flex-col bg-zinc-950 text-white overflow-hidden">
      <Navbar />

      {/* Free Gemini API Key Setup Notice Banner */}
      {!hasApiKey && showKeyBanner && (
        <div className="flex items-center justify-between border-b border-amber-500/20 bg-amber-950/30 px-3.5 py-1.5 text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span className="truncate">
              Enable 1-Click AI Auto-Boost and ATS Job Tailoring by connecting your free Gemini API key (cached 100% locally on your machine).
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setApiKeyModalOpen(true)}
              className="rounded-md bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300 transition-colors"
            >
              Connect Free Key
            </button>
            <button
              onClick={() => setShowKeyBanner(false)}
              className="p-1 text-amber-400/60 hover:text-amber-300 transition-colors"
              title="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

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
              onCompile={() => triggerCompile(latexCode)}
              isCompiling={isCompiling}
              errors={errors}
              targetLine={targetLine}
              targetLabel={targetLabel}
              viewMode={viewMode}
              onViewModeChange={(m) => setViewMode(m)}
              liveAtsScore={liveAtsScore}
              onOpenScore={() => setIsScoreOpen(true)}
              onToggleAi={() => setIsAiOpen(!isAiOpen)}
              isAiOpen={isAiOpen}
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
            className="group relative flex w-3 items-center justify-center cursor-col-resize select-none shrink-0 z-20"
          >
            {/* Delicate shaped pill handle without rectangular highlight */}
            <div className="flex h-10 w-1.5 items-center justify-center rounded-full bg-zinc-800/90 border border-zinc-700/60 shadow-sm group-hover:bg-emerald-400 group-hover:border-emerald-300 group-hover:h-16 group-hover:shadow-[0_0_12px_rgba(52,211,153,0.6)] group-active:bg-emerald-400 group-active:h-16 transition-all duration-200">
              <div className="h-4 w-0.5 rounded-full bg-zinc-600 group-hover:bg-zinc-950 transition-colors" />
            </div>
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
              onNavigateToLine={handleNavigateToLine}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
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

        {/* AI Assistant Drawer with 1-Click Auto-Boost */}
        <AiAssistant
          currentLatex={latexCode}
          onApplyChange={handleApplyAi}
          onUndoChange={handleUndoAi}
          targetJd={targetJd}
          isOpen={isAiOpen}
          onClose={() => setIsAiOpen(false)}
          onExecuteAutoBoost={handleExecuteAutoBoost}
          isBoosting={isBoosting}
        />
      </main>

      {/* Pro-Grade Desktop Status Bar */}
      <footer className="hidden sm:flex h-6 items-center justify-between border-t border-zinc-800/80 bg-zinc-950 px-3 text-[11px] font-mono text-zinc-400 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="text-zinc-300">Tectonic v0.17</span>
          </div>
          <span>•</span>
          <span className="text-zinc-500">{compileTimeMs}ms compile</span>
          {lastSavedTime && (
            <>
              <span>•</span>
              <span className="text-zinc-400 flex items-center gap-1">
                <Check className="h-3 w-3 text-emerald-400" />
                <span>Autosaved locally ({lastSavedTime})</span>
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-4">
          <span>{lineCount} lines</span>
          <span>•</span>
          <span>{wordCount} words</span>
          <span>•</span>
          <span className="text-zinc-500">UTF-8 LaTeX</span>
        </div>
      </footer>

      {/* Global API Key Setup Modal */}
      <ApiKeyModal
        isOpen={apiKeyModalOpen}
        onClose={() => setApiKeyModalOpen(false)}
        onKeySaved={(k) => setHasApiKey(Boolean(k))}
      />
    </div>
  );
}
