"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { 
  Check, 
  Copy, 
  Undo2, 
  Redo2, 
  AlertCircle,
  Play,
  TrendingUp,
  Zap,
  Sparkles,
  Loader2,
  Columns,
  Code2,
  FileText
} from "lucide-react";

// Dynamic import of Monaco to prevent SSR issues
const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface LatexEditorProps {
  code: string;
  onChange: (value: string) => void;
  onCompile?: () => void;
  isCompiling?: boolean;
  errors?: Array<{ line: string | number; message: string }>;
  targetLine?: number | null;
  targetLabel?: string | null;
  viewMode?: "split" | "editor" | "preview";
  onViewModeChange?: (mode: "split" | "editor" | "preview") => void;
  liveAtsScore?: number | null;
  onOpenScore?: () => void;
  onAutoBoost?: () => void;
  isBoosting?: boolean;
  onToggleAi?: () => void;
  isAiOpen?: boolean;
}

export default function LatexEditor({
  code,
  onChange,
  onCompile,
  isCompiling = false,
  errors = [],
  targetLine = null,
  targetLabel = null,
  viewMode = "split",
  onViewModeChange,
  liveAtsScore = null,
  onOpenScore,
  onAutoBoost,
  isBoosting = false,
  onToggleAi,
  isAiOpen = false,
}: LatexEditorProps) {
  const [copied, setCopied] = useState(false);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);
  const isInternalChangeRef = useRef(false);

  // When external/AI code changes arrive, apply them as a single undoable transaction
  useEffect(() => {
    if (!editorRef.current) return;
    const currentVal = editorRef.current.getValue();
    if (code !== currentVal && !isInternalChangeRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        editorRef.current.pushUndoStop();
        editorRef.current.executeEdits("ai-assistant-edit", [
          {
            range: model.getFullModelRange(),
            text: code,
            forceMoveMarkers: true,
          },
        ]);
        editorRef.current.pushUndoStop();
      }
    }
    isInternalChangeRef.current = false;
  }, [code]);

  // Handle SyncTeX Click-to-Source from PDF preview: soft transparent highlight
  useEffect(() => {
    if (targetLine && editorRef.current && monacoRef.current) {
      editorRef.current.revealLineInCenter(targetLine);
      editorRef.current.setPosition({ lineNumber: targetLine, column: 1 });
      editorRef.current.focus();

      // Soft, transparent emerald wash that preserves dark background and crisp white text
      decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, [
        {
          range: new monacoRef.current.Range(targetLine, 1, targetLine, 1),
          options: {
            isWholeLine: true,
            className: "bg-emerald-500/10 border-l-2 border-emerald-400/70",
          },
        },
      ]);

      const timer = setTimeout(() => {
        if (editorRef.current) {
          decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, []);
        }
      }, 2200);

      return () => clearTimeout(timer);
    }
  }, [targetLine]);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  };

  const handleEditorChange = (val: string | undefined) => {
    isInternalChangeRef.current = true;
    onChange(val || "");
  };

  const handleUndo = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.trigger("toolbar", "undo", null);
      editorRef.current.focus();
    }
  }, []);

  const handleRedo = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.trigger("toolbar", "redo", null);
      editorRef.current.focus();
    }
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lineCount = code.split("\n").length;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl">
      {/* Integrated Unified Header */}
      <div className="flex flex-wrap min-h-10 items-center justify-between border-b border-zinc-800/80 bg-zinc-900/60 px-2.5 sm:px-3 py-1.5 gap-2 text-xs">
        {/* Left: File + Compile Icon + Undo / Redo */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1.5 pr-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            <span className="font-mono text-zinc-300 font-medium text-xs">resume.tex</span>
          </div>

          {/* Recompile Icon Button directly in Editor */}
          {onCompile && (
            <button
              onClick={onCompile}
              disabled={isCompiling}
              className="flex items-center gap-1.5 rounded-md bg-emerald-500/15 border border-emerald-500/40 px-2.5 py-1 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25 transition-all disabled:opacity-50 touch-manipulation shadow-sm"
              title="Compile LaTeX to PDF (⌘S / Ctrl+S)"
            >
              <Play className={`h-3 w-3 fill-emerald-400 text-emerald-400 ${isCompiling ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline font-mono text-[11px]">{isCompiling ? "Compiling..." : "Compile"}</span>
              <kbd className="hidden md:inline-block rounded bg-zinc-800/80 px-1 py-0.2 text-[9px] font-mono text-zinc-400">⌘S</kbd>
            </button>
          )}

          {/* Undo / Redo Controls */}
          <div className="flex items-center rounded-md border border-zinc-800 bg-zinc-900/90 p-0.5">
            <button
              onClick={handleUndo}
              className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors touch-manipulation"
              title="Undo (⌘Z / Ctrl+Z)"
            >
              <Undo2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleRedo}
              className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors touch-manipulation"
              title="Redo (⌘⇧Z / Ctrl+Y)"
            >
              <Redo2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Right: View Mode + ATS Score + Auto-Boost + AI Copilot + Copy */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* View Mode Switcher */}
          {onViewModeChange && (
            <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-950 p-0.5">
              <button
                onClick={() => onViewModeChange("editor")}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  viewMode === "editor" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-white"
                }`}
                title="Editor only"
              >
                <Code2 className="h-3.5 w-3.5 sm:hidden" />
                <span className="hidden sm:inline">Code</span>
              </button>
              <button
                onClick={() => onViewModeChange("split")}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  viewMode === "split" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-white"
                }`}
                title="Split screen"
              >
                <Columns className="h-3.5 w-3.5 sm:hidden" />
                <span className="hidden sm:inline">Split</span>
              </button>
              <button
                onClick={() => onViewModeChange("preview")}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  viewMode === "preview" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-white"
                }`}
                title="PDF Preview only"
              >
                <FileText className="h-3.5 w-3.5 sm:hidden" />
                <span className="hidden sm:inline">PDF</span>
              </button>
            </div>
          )}

          {/* ATS Score Button */}
          {onOpenScore && (
            <button
              onClick={onOpenScore}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-950/30 px-2 sm:px-2.5 py-1 text-xs font-mono font-bold text-emerald-400 hover:bg-emerald-900/40 transition-colors shadow-sm"
              title="Open ATS Score Diagnostics & Benchmark"
            >
              <TrendingUp className="h-3.5 w-3.5" />
              <span>ATS {liveAtsScore ? `${liveAtsScore}%` : "..."}</span>
            </button>
          )}

          {/* 1-Click Auto Boost */}
          {onAutoBoost && (
            <button
              onClick={onAutoBoost}
              disabled={isBoosting}
              className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-400 px-2 sm:px-2.5 py-1 text-xs font-bold text-zinc-950 hover:brightness-110 shadow-sm transition-all disabled:opacity-50 touch-manipulation"
              title="1-Click Auto-Boost using Google X-Y-Z formula (⌘B)"
            >
              {isBoosting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5 fill-zinc-950" />}
              <span className="hidden sm:inline">Auto-Boost</span>
              <kbd className="hidden lg:inline text-[9px] bg-zinc-900/30 text-zinc-950 px-1 rounded font-mono">⌘B</kbd>
            </button>
          )}

          {/* AI Copilot Toggle */}
          {onToggleAi && (
            <button
              onClick={onToggleAi}
              className={`flex items-center gap-1 rounded-lg border px-2 sm:px-2.5 py-1 text-xs font-medium transition-all ${
                isAiOpen
                  ? "border-indigo-500 bg-indigo-950/70 text-white"
                  : "border-indigo-500/40 bg-indigo-950/20 text-indigo-300 hover:bg-indigo-900/40"
              }`}
              title="Toggle LaTeX AI Copilot"
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Copilot</span>
            </button>
          )}

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            title="Copy LaTeX source code"
            className="flex items-center gap-1 rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {/* Monaco Container */}
      <div className="relative flex-1 min-h-[450px]">
        <Editor
          height="100%"
          language="latex"
          theme="vs-dark"
          value={code}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            fontSize: 13,
            fontFamily: "Geist Mono, JetBrains Mono, Menlo, monospace",
            minimap: { enabled: false },
            lineNumbers: "on",
            wordWrap: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            smoothScrolling: true,
            cursorBlinking: "smooth",
            renderLineHighlight: "all",
            padding: { top: 12, bottom: 12 },
          }}
        />

        {/* Error Notification Drawer if syntax error exists */}
        {errors.length > 0 && (
          <div className="absolute bottom-3 left-3 right-3 rounded-lg border border-rose-500/30 bg-rose-950/90 p-3 shadow-lg backdrop-blur">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-rose-400 mt-0.5 shrink-0" />
              <div className="flex-1 text-xs">
                <span className="font-semibold text-rose-300">LaTeX Compilation Error</span>
                <ul className="mt-1 space-y-1 text-rose-200/80 font-mono text-[11px]">
                  {errors.slice(0, 3).map((err, idx) => (
                    <li key={idx}>
                      Line {err.line}: {err.message}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
