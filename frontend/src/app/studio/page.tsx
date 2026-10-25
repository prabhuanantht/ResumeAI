"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  Profile 
} from "@/lib/api";
import { 
  Sparkles, 
  Code2, 
  FileText, 
  Columns, 
  TrendingUp, 
  PanelLeftClose, 
  PanelRightClose,
  Maximize2
} from "lucide-react";

type ViewMode = "split" | "editor" | "preview";

export default function StudioPage() {
  const [latexCode, setLatexCode] = useState<string>("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [errorLog, setErrorLog] = useState<string | null>(null);
  const [errors, setErrors] = useState<Array<{ line: string | number; message: string }>>([]);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isScoreOpen, setIsScoreOpen] = useState(false);
  const [liveAtsScore, setLiveAtsScore] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);

  // iPad & screen size responsiveness
  useEffect(() => {
    const handleResize = () => {
      // 11-inch iPad portrait is 834px
      if (window.innerWidth < 1000) {
        setViewMode((current) => (current === "split" ? "preview" : current));
      } else {
        setViewMode("split");
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Compilation trigger
  const triggerCompile = useCallback(async (codeToCompile: string) => {
    if (!codeToCompile) return;
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

      // Also compute baseline live ATS score
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

  // Keyboard shortcut Cmd+S / Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        triggerCompile(latexCode);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [latexCode, triggerCompile]);

  const handleApplyAi = (newCode: string) => {
    setLatexCode(newCode);
    triggerCompile(newCode);
  };

  return (
    <div className="flex h-[100dvh] flex-col bg-zinc-950 text-white overflow-hidden">
      <Navbar onCompile={() => triggerCompile(latexCode)} isCompiling={isCompiling} />

      {/* iPad-optimized Subtoolbar (View Mode Switcher + Live ATS Score Trigger) */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 bg-zinc-900/60 px-3 py-1.5 text-xs">
        {/* Segmented View Mode Control (Crucial for 11" iPad portrait & tablets) */}
        <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-950/80 p-0.5 shadow-inner">
          <button
            onClick={() => setViewMode("editor")}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all touch-manipulation ${
              viewMode === "editor"
                ? "bg-zinc-800 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            <span>Editor</span>
          </button>

          <button
            onClick={() => setViewMode("split")}
            className={`hidden md:flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all touch-manipulation ${
              viewMode === "split"
                ? "bg-zinc-800 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
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
          >
            <FileText className="h-3.5 w-3.5" />
            <span>PDF Preview</span>
          </button>
        </div>

        {/* Live Resume Score Button in Toolbar */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsScoreOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-950/30 px-3 py-1 text-xs font-medium text-emerald-400 hover:bg-emerald-900/40 hover:border-emerald-500/50 transition-all touch-manipulation shadow-sm"
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span className="font-mono font-semibold">
              ATS Score: {liveAtsScore ? `${liveAtsScore}%` : "Calculating..."}
            </span>
          </button>

          <button
            onClick={() => setIsAiOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/80 px-2.5 py-1 text-xs font-medium text-zinc-300 hover:bg-zinc-700 transition-all touch-manipulation"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden sm:inline">AI Copilot</span>
          </button>
        </div>
      </div>

      {/* Main Studio Split Canvas */}
      <main className="relative flex flex-1 overflow-hidden p-2 sm:p-3 gap-2 sm:gap-3 min-h-0">
        {/* Left Column: Monaco Code Editor */}
        {(viewMode === "split" || viewMode === "editor") && (
          <div className="flex-1 h-full min-w-0 transition-all">
            <LatexEditor
              code={latexCode}
              onChange={(val) => setLatexCode(val)}
              onSave={() => triggerCompile(latexCode)}
              errors={errors}
              isCompiling={isCompiling}
            />
          </div>
        )}

        {/* Right Column: PDF Preview Viewport with horizontal scroll */}
        {(viewMode === "split" || viewMode === "preview") && (
          <div className="flex-1 h-full min-w-0 transition-all">
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
          onQuickAiFix={(instruction) => {
            setIsScoreOpen(false);
            setIsAiOpen(true);
          }}
        />

        {/* AI Assistant Drawer */}
        <AiAssistant
          currentLatex={latexCode}
          onApplyChange={handleApplyAi}
          isOpen={isAiOpen}
          onClose={() => setIsAiOpen(false)}
        />
      </main>
    </div>
  );
}
