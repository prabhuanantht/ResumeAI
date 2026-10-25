"use client";

import React, { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/navigation/Navbar";
import LatexEditor from "@/components/editor/LatexEditor";
import PdfViewer from "@/components/editor/PdfViewer";
import AiAssistant from "@/components/editor/AiAssistant";
import { 
  getProfile, 
  compilePdf, 
  validateLatex,
  Profile 
} from "@/lib/api";
import { Sparkles, SplitSquareVertical, ArrowLeftRight, Check, AlertCircle } from "lucide-react";

export default function StudioPage() {
  const [latexCode, setLatexCode] = useState<string>("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [errorLog, setErrorLog] = useState<string | null>(null);
  const [errors, setErrors] = useState<Array<{ line: string | number; message: string }>>([]);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);

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
    } catch (err: any) {
      console.error("Compile error:", err);
      setErrorLog(err.message || "Compilation failed");
      // Try extracting error lines
      const validation = await validateLatex(codeToCompile);
      if (!validation.valid && validation.errors) {
        setErrors(validation.errors);
      }
    } finally {
      setIsCompiling(false);
    }
  }, []);

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
    <div className="flex h-screen flex-col bg-zinc-950 text-white overflow-hidden">
      <Navbar onCompile={() => triggerCompile(latexCode)} isCompiling={isCompiling} />

      {/* Main Studio Split Canvas */}
      <main className="relative flex flex-1 overflow-hidden p-2 sm:p-3 gap-2 sm:gap-3">
        {/* Left Column: Monaco Code Editor */}
        <div className="flex-1 h-full min-w-0 transition-all">
          <LatexEditor
            code={latexCode}
            onChange={(val) => setLatexCode(val)}
            onSave={() => triggerCompile(latexCode)}
            errors={errors}
            isCompiling={isCompiling}
          />
        </div>

        {/* Right Column: PDF Preview Viewport */}
        <div className="flex-1 h-full min-w-0 transition-all">
          <PdfViewer
            pdfUrl={pdfUrl}
            latexCode={latexCode}
            isCompiling={isCompiling}
            errorLog={errorLog}
            onRetry={() => triggerCompile(latexCode)}
          />
        </div>

        {/* AI Assistant Drawer */}
        <AiAssistant
          currentLatex={latexCode}
          onApplyChange={handleApplyAi}
          isOpen={isAiOpen}
          onClose={() => setIsAiOpen(false)}
        />

        {/* Floating AI Drawer Toggle Button if closed */}
        {!isAiOpen && (
          <button
            onClick={() => setIsAiOpen(true)}
            className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full border border-emerald-500/40 bg-zinc-900/90 px-4 py-2.5 text-xs font-semibold text-emerald-300 shadow-2xl backdrop-blur hover:bg-zinc-800 hover:scale-105 transition-all"
          >
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <span>AI Copilot</span>
          </button>
        )}
      </main>
    </div>
  );
}
