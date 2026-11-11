"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import Navbar from "@/components/navigation/Navbar";
import LatexEditor from "@/components/editor/LatexEditor";
import AiAssistant from "@/components/editor/AiAssistant";
import StudioTailorPanel from "@/components/studio/StudioTailorPanel";
import ResumeScorerDrawer from "@/components/editor/ResumeScorerDrawer";
import ApiKeyModal from "@/components/settings/ApiKeyModal";
import ResumeImportModal from "@/components/upload/ResumeImportModal";

const PdfViewer = dynamic(() => import("@/components/editor/PdfViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-zinc-950 text-zinc-500">
      <div className="flex items-center gap-2 text-xs">
        <span className="h-3 w-3 animate-spin rounded-full border border-emerald-400 border-t-transparent" />
        <span>Loading PDF viewer...</span>
      </div>
    </div>
  ),
});

import { 
  getProfile, 
  compilePdf, 
  validateLatex, 
  scoreResume,
  autoBoostResume,
  chatEditResume,
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
  Target,
  Layers,
  LayoutGrid,
  Bot
} from "lucide-react";
import confetti from "canvas-confetti";

type LeftPaneTab = "editor" | "copilot" | "tailor";
type LayoutMode = "split" | "3-panel" | "editor-only" | "preview-only";

export default function StudioPage() {
  const [latexCode, setLatexCode] = useState<string>("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileTimeMs, setCompileTimeMs] = useState<number>(340);
  const [errorLog, setErrorLog] = useState<string | null>(null);
  const [errors, setErrors] = useState<Array<{ line: string | number; message: string }>>([]);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [autoFixSignal, setAutoFixSignal] = useState<number>(0);
  const [isScoreOpen, setIsScoreOpen] = useState(false);
  const [liveAtsScore, setLiveAtsScore] = useState<number | null>(null);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);

  // Left Pane View and Overall Screen Layout
  const [leftPaneTab, setLeftPaneTab] = useState<LeftPaneTab>("editor");
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("split");

  // Mobile Responsiveness State
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [mobileTab, setMobileTab] = useState<"editor" | "copilot" | "tailor" | "preview">("editor");

  // Auto-heal state for zero first-time failures
  const [isAutoHealing, setIsAutoHealing] = useState<boolean>(false);
  const hasAutoHealedRef = useRef<boolean>(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
  const [importModalOpen, setImportModalOpen] = useState<boolean>(false);
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

  // Robust compilation trigger with zero-error silent auto-heal for initial loads
  const triggerCompile = useCallback(async (codeToCompile: string, isInitialCheck = false) => {
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
      const errMsg = err.message || "Compilation failed";
      setErrorLog(errMsg);
      const validation = await validateLatex(codeToCompile);
      if (!validation.valid && validation.errors) {
        setErrors(validation.errors);
      }

      // Zero First-Time Failures: Auto-heal silently on first failure!
      if (isInitialCheck && !hasAutoHealedRef.current) {
        hasAutoHealedRef.current = true;
        try {
          setIsAutoHealing(true);
          const res = await chatEditResume({
            current_latex: codeToCompile,
            instruction: "Fix all LaTeX syntax and compilation errors so this document renders cleanly without errors",
            error_log: errMsg,
          });
          if (res.updated_latex && res.updated_latex !== codeToCompile) {
            setLatexCode(res.updated_latex);
            const retryBlob = await compilePdf(res.updated_latex, "Resume");
            const retryUrl = URL.createObjectURL(retryBlob);
            setPdfUrl(retryUrl);
            setErrorLog(null);
            setErrors([]);
            setLastSavedTime("Auto-Healed");
          }
        } catch (healErr) {
          console.warn("Silent initial auto-heal attempt failed:", healErr);
        } finally {
          setIsAutoHealing(false);
        }
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
          triggerCompile(cachedDraft, true);
          setLastSavedTime("Restored");
          return;
        }

        const profile = await getProfile();
        setActiveProfile(profile);
        const code = profile.primary_latex;
        setLatexCode(code);
        triggerCompile(code, true);
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

  // Draggable Split Divider Logic
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

  const handleApplyTailored = (newCode: string, _summary?: string[]) => {
    setPreviousLatex(latexCode);
    setLatexCode(newCode);
    triggerCompile(newCode);
  };

  const handleUndoAi = (previousCode: string) => {
    setLatexCode(previousCode);
    triggerCompile(previousCode);
  };

  const handleAutoFixError = (_err?: string) => {
    // Bring Copilot into focus on left so user can see Copilot + Resume
    if (isMobile) {
      setMobileTab("copilot");
    } else {
      setLeftPaneTab("copilot");
      if (layoutMode === "preview-only") setLayoutMode("split");
    }
    setAutoFixSignal(Date.now());
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
    if (isMobile) {
      setMobileTab("editor");
    } else {
      setLeftPaneTab("editor");
      if (layoutMode === "preview-only") {
        setLayoutMode("split");
      }
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

      {/* Studio Top Control Strip: Screen Combos, Mode Switchers & ATS Meter */}
      <div className="hidden sm:flex h-11 items-center justify-between border-b border-zinc-800/80 bg-zinc-950/90 px-3 shrink-0 text-xs gap-3">
        {/* Left Side: Left-Pane Mode Switcher Tabs */}
        <div className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900/70 p-0.5">
          <button
            onClick={() => {
              setLeftPaneTab("editor");
              if (layoutMode === "preview-only") setLayoutMode("split");
            }}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-medium transition-all ${
              leftPaneTab === "editor"
                ? "bg-zinc-800 text-white font-semibold shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
            title="LaTeX Code & Visual Text Editor"
          >
            <Code2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Editor</span>
          </button>
          <button
            onClick={() => {
              setLeftPaneTab("copilot");
              if (layoutMode === "preview-only") setLayoutMode("split");
            }}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-medium transition-all ${
              leftPaneTab === "copilot"
                ? "bg-zinc-800 text-white font-semibold shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
            title="AI Copilot Side-by-Side with Resume"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span>AI Copilot</span>
          </button>
          <button
            onClick={() => {
              setLeftPaneTab("tailor");
              if (layoutMode === "preview-only") setLayoutMode("split");
            }}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-medium transition-all ${
              leftPaneTab === "tailor"
                ? "bg-zinc-800 text-white font-semibold shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
            title="Job Tailoring, ATS Score & Keyword Match"
          >
            <Target className="h-3.5 w-3.5 text-teal-400" />
            <span>Tailor & ATS</span>
          </button>
        </div>

        {/* Center: Layout Combos Selector */}
        <div className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900/70 p-0.5">
          <button
            onClick={() => setLayoutMode("split")}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-all ${
              layoutMode === "split"
                ? "bg-emerald-500 text-zinc-950 font-bold shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
            title="2-Panel Split: Active Tab + Live Resume Preview"
          >
            <Columns className="h-3.5 w-3.5" />
            <span>
              {leftPaneTab === "editor" ? "Editor + Resume" : leftPaneTab === "copilot" ? "Copilot + Resume" : "Tailor + Resume"}
            </span>
          </button>
          <button
            onClick={() => setLayoutMode("3-panel")}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-all ${
              layoutMode === "3-panel"
                ? "bg-emerald-500 text-zinc-950 font-bold shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
            title="3-Panel Combo: Editor + Copilot + Live Resume side-by-side"
          >
            <Layers className="h-3.5 w-3.5" />
            <span>3-Panel Combo</span>
          </button>
          <button
            onClick={() => setLayoutMode("editor-only")}
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-all ${
              layoutMode === "editor-only"
                ? "bg-zinc-800 text-white font-semibold shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
            title="Full Focus Editor"
          >
            <Code2 className="h-3 w-3" />
            <span>Editor Only</span>
          </button>
          <button
            onClick={() => setLayoutMode("preview-only")}
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-all ${
              layoutMode === "preview-only"
                ? "bg-zinc-800 text-white font-semibold shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
            title="Full Focus Resume PDF"
          >
            <FileText className="h-3 w-3" />
            <span>PDF Only</span>
          </button>
        </div>

        {/* Right Side: Quick Action Buttons */}
        <div className="flex items-center gap-2">
          {liveAtsScore !== null && (
            <button
              onClick={() => setIsScoreOpen(true)}
              className="flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/90 px-2.5 py-1 text-xs hover:border-emerald-500/40 transition-colors"
              title="View In-Depth ATS Breakdown"
            >
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              <span className="font-mono font-bold text-emerald-400">{liveAtsScore}% ATS</span>
            </button>
          )}

          <button
            onClick={() => handleExecuteAutoBoost()}
            disabled={isBoosting}
            className="flex items-center gap-1.5 rounded-md bg-emerald-500/15 border border-emerald-500/40 px-2.5 py-1 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25 transition-all disabled:opacity-50"
            title="1-Click Auto-Boost Bullets (⌘B)"
          >
            {isBoosting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />
            ) : (
              <Zap className="h-3.5 w-3.5 fill-current text-emerald-400" />
            )}
            <span>Auto-Boost</span>
          </button>
        </div>
      </div>

      {/* Main Studio Canvas with Pro Draggable Divider & Layout Combos */}
      <main
        ref={mainContainerRef}
        className="relative flex flex-1 overflow-hidden p-1.5 sm:p-2.5 min-h-0 select-text gap-2"
      >
        {/* 3-Panel Combo Mode (Desktop Only) */}
        {!isMobile && layoutMode === "3-panel" && (
          <div className="flex h-full w-full gap-2 min-h-0">
            {/* Panel 1: Code Editor (30%) */}
            <div className="h-full w-[30%] min-w-[260px] min-h-0">
              <LatexEditor
                code={latexCode}
                onChange={(val) => setLatexCode(val)}
                onCompile={() => triggerCompile(latexCode)}
                isCompiling={isCompiling}
                errors={errors}
                targetLine={targetLine}
                targetLabel={targetLabel}
                viewMode="split"
                liveAtsScore={liveAtsScore}
                onOpenScore={() => setIsScoreOpen(true)}
                onToggleAi={() => setLeftPaneTab((prev) => (prev === "copilot" ? "editor" : "copilot"))}
                isAiOpen={leftPaneTab === "copilot"}
                onOpenImport={() => setImportModalOpen(true)}
              />
            </div>

            {/* Panel 2: Embedded AI Copilot or Tailor (30%) */}
            <div className="h-full w-[30%] min-w-[280px] min-h-0">
              {leftPaneTab === "tailor" ? (
                <StudioTailorPanel
                  currentLatex={latexCode}
                  onApplyTailored={handleApplyTailored}
                  onUndoTailor={() => handleUndoAi(previousLatex || "")}
                  canUndo={Boolean(previousLatex)}
                  onSwitchToEditor={() => setLeftPaneTab("editor")}
                  onSwitchToCopilot={() => setLeftPaneTab("copilot")}
                />
              ) : (
                <AiAssistant
                  embedded={true}
                  currentLatex={latexCode}
                  onApplyChange={handleApplyAi}
                  onUndoChange={handleUndoAi}
                  targetJd={targetJd}
                  onExecuteAutoBoost={handleExecuteAutoBoost}
                  isBoosting={isBoosting}
                  errorLog={errorLog}
                  autoFixSignal={autoFixSignal}
                  onSwitchToTailor={() => setLeftPaneTab("tailor")}
                />
              )}
            </div>

            {/* Panel 3: Live PDF Preview (40%) */}
            <div className="h-full flex-1 min-w-[320px] min-h-0">
              <PdfViewer
                pdfUrl={pdfUrl}
                latexCode={latexCode}
                isCompiling={isCompiling}
                errorLog={errorLog}
                onRetry={() => triggerCompile(latexCode)}
                onOpenScore={() => setIsScoreOpen(true)}
                atsScore={liveAtsScore}
                onNavigateToLine={handleNavigateToLine}
                onAutoFixError={handleAutoFixError}
                viewMode="split"
              />
            </div>
          </div>
        )}

        {/* Standard Split or Single Mode */}
        {(!isMobile ? layoutMode !== "3-panel" : true) && (
          <>
            {/* Left Column: Swappable Tab (Editor / Copilot / Tailor) */}
            {(!isMobile ? layoutMode !== "preview-only" : mobileTab !== "preview") && (
              <div
                style={{
                  width: !isMobile && layoutMode === "split" ? `${splitRatio}%` : "100%",
                  minWidth: !isMobile && layoutMode === "split" ? "280px" : undefined,
                }}
                className="h-full min-h-0 transition-[width] duration-75 w-full"
              >
                {/* When on Mobile, display according to mobileTab */}
                {isMobile ? (
                  mobileTab === "editor" ? (
                    <LatexEditor
                      code={latexCode}
                      onChange={(val) => setLatexCode(val)}
                      onCompile={() => triggerCompile(latexCode)}
                      isCompiling={isCompiling}
                      errors={errors}
                      targetLine={targetLine}
                      targetLabel={targetLabel}
                      viewMode="editor"
                      liveAtsScore={liveAtsScore}
                      onOpenScore={() => setIsScoreOpen(true)}
                      onToggleAi={() => setMobileTab("copilot")}
                      isAiOpen={false}
                      onOpenImport={() => setImportModalOpen(true)}
                    />
                  ) : mobileTab === "copilot" ? (
                    <AiAssistant
                      embedded={true}
                      currentLatex={latexCode}
                      onApplyChange={handleApplyAi}
                      onUndoChange={handleUndoAi}
                      targetJd={targetJd}
                      onExecuteAutoBoost={handleExecuteAutoBoost}
                      isBoosting={isBoosting}
                      errorLog={errorLog}
                      autoFixSignal={autoFixSignal}
                      onSwitchToTailor={() => setMobileTab("tailor")}
                    />
                  ) : mobileTab === "tailor" ? (
                    <StudioTailorPanel
                      currentLatex={latexCode}
                      onApplyTailored={handleApplyTailored}
                      onUndoTailor={() => handleUndoAi(previousLatex || "")}
                      canUndo={Boolean(previousLatex)}
                      onSwitchToEditor={() => setMobileTab("editor")}
                      onSwitchToCopilot={() => setMobileTab("copilot")}
                    />
                  ) : null
                ) : (
                  /* Desktop: display based on leftPaneTab */
                  leftPaneTab === "editor" ? (
                    <LatexEditor
                      code={latexCode}
                      onChange={(val) => setLatexCode(val)}
                      onCompile={() => triggerCompile(latexCode)}
                      isCompiling={isCompiling}
                      errors={errors}
                      targetLine={targetLine}
                      targetLabel={targetLabel}
                      viewMode={layoutMode === "editor-only" ? "editor" : "split"}
                      onViewModeChange={(m) => setLayoutMode(m === "preview" ? "preview-only" : m === "editor" ? "editor-only" : "split")}
                      liveAtsScore={liveAtsScore}
                      onOpenScore={() => setIsScoreOpen(true)}
                      onToggleAi={() => setLeftPaneTab("copilot")}
                      isAiOpen={false}
                      onOpenImport={() => setImportModalOpen(true)}
                    />
                  ) : leftPaneTab === "copilot" ? (
                    /* The user can view Copilot on the left and full PDF on the right! */
                    <AiAssistant
                      embedded={true}
                      currentLatex={latexCode}
                      onApplyChange={handleApplyAi}
                      onUndoChange={handleUndoAi}
                      targetJd={targetJd}
                      onExecuteAutoBoost={handleExecuteAutoBoost}
                      isBoosting={isBoosting}
                      errorLog={errorLog}
                      autoFixSignal={autoFixSignal}
                      onSwitchToTailor={() => setLeftPaneTab("tailor")}
                    />
                  ) : (
                    /* Tailor & ATS on the left, full PDF on the right! */
                    <StudioTailorPanel
                      currentLatex={latexCode}
                      onApplyTailored={handleApplyTailored}
                      onUndoTailor={() => handleUndoAi(previousLatex || "")}
                      canUndo={Boolean(previousLatex)}
                      onSwitchToEditor={() => setLeftPaneTab("editor")}
                      onSwitchToCopilot={() => setLeftPaneTab("copilot")}
                    />
                  )
                )}
              </div>
            )}

            {/* Pro Draggable Split Divider on Desktop Only */}
            {!isMobile && layoutMode === "split" && (
              <div
                onMouseDown={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDoubleClick={() => setSplitRatio(50)}
                title="Drag to resize panels • Double-click to reset 50/50"
                className="group relative flex w-3 items-center justify-center cursor-col-resize select-none shrink-0 z-20"
              >
                <div className="flex h-10 w-1.5 items-center justify-center rounded-full bg-zinc-800/90 border border-zinc-700/60 shadow-sm group-hover:bg-emerald-400 group-hover:border-emerald-300 group-hover:h-16 group-hover:shadow-[0_0_12px_rgba(52,211,153,0.6)] group-active:bg-emerald-400 group-active:h-16 transition-all duration-200">
                  <div className="h-4 w-0.5 rounded-full bg-zinc-600 group-hover:bg-zinc-950 transition-colors" />
                </div>
              </div>
            )}

            {/* Right Column: PDF Preview Viewport */}
            {(!isMobile ? layoutMode !== "editor-only" : mobileTab === "preview") && (
              <div
                style={{
                  width: !isMobile && layoutMode === "split" ? `${100 - splitRatio}%` : "100%",
                  minWidth: !isMobile && layoutMode === "split" ? "280px" : undefined,
                }}
                className="h-full min-h-0 transition-[width] duration-75 w-full"
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
                  onAutoFixError={handleAutoFixError}
                  viewMode={layoutMode === "preview-only" ? "preview" : "split"}
                  onViewModeChange={(m) => setLayoutMode(m === "preview" ? "preview-only" : m === "editor" ? "editor-only" : "split")}
                />
              </div>
            )}
          </>
        )}

        {/* Mobile Floating Quick Switch Bar */}
        {isMobile && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 rounded-full border border-zinc-700/80 bg-zinc-950/95 p-1 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-2">
            <button
              onClick={() => setMobileTab("editor")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all touch-manipulation ${
                mobileTab === "editor"
                  ? "bg-emerald-500 text-zinc-950 shadow-md font-bold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Code2 className="h-3.5 w-3.5" />
              <span>Editor</span>
            </button>
            <button
              onClick={() => setMobileTab("copilot")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all touch-manipulation ${
                mobileTab === "copilot"
                  ? "bg-emerald-500 text-zinc-950 shadow-md font-bold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Copilot</span>
            </button>
            <button
              onClick={() => setMobileTab("tailor")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all touch-manipulation ${
                mobileTab === "tailor"
                  ? "bg-teal-500 text-zinc-950 shadow-md font-bold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Target className="h-3.5 w-3.5" />
              <span>Tailor</span>
            </button>
            <button
              onClick={() => {
                setMobileTab("preview");
                if (!pdfUrl) triggerCompile(latexCode);
              }}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all touch-manipulation ${
                mobileTab === "preview"
                  ? "bg-emerald-500 text-zinc-950 shadow-md font-bold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>PDF</span>
              {isCompiling && <Loader2 className="h-3 w-3 animate-spin text-zinc-950" />}
            </button>
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
          {isAutoHealing && (
            <>
              <span>•</span>
              <span className="text-amber-400 flex items-center gap-1 animate-pulse">
                <Sparkles className="h-3 w-3" />
                <span>Auto-healing syntax...</span>
              </span>
            </>
          )}
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

      {/* Resume Import & Template Selection Modal */}
      <ResumeImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImportSuccess={(newCode) => {
          setLatexCode(newCode);
          triggerCompile(newCode, true);
        }}
      />
    </div>
  );
}
