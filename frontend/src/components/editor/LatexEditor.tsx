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
  RefreshCw,
  TrendingUp,
  Sparkles,
  Columns,
  Code2,
  FileText,
  AlignLeft,
  Upload
} from "lucide-react";
import VisualResumeEditor from "./VisualResumeEditor";

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
  onToggleAi?: () => void;
  isAiOpen?: boolean;
  onOpenImport?: () => void;
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
  onToggleAi,
  isAiOpen = false,
  onOpenImport,
}: LatexEditorProps) {
  const [copied, setCopied] = useState(false);
  const [editorMode, setEditorMode] = useState<"text" | "code">("text");
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);
  const isInternalChangeRef = useRef(false);

  // Auto-switch to code mode if click-to-source navigation occurs
  useEffect(() => {
    if (targetLine && editorMode !== "code") {
      setEditorMode("code");
    }
  }, [targetLine, editorMode]);

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

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl">
      {/* Single-Line Compact Toolbar: Icons Only (Except Copilot) */}
      <div className="flex h-10 items-center justify-between border-b border-zinc-800/80 bg-zinc-900/60 px-3 text-xs shrink-0 select-none">
        {/* Left: Mode Toggle (Text vs Code) + Compile Icon + Undo / Redo */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Editor Mode Switcher: Text (Visual) vs Code (LaTeX) */}
          <div className="flex items-center rounded-md border border-zinc-800 bg-zinc-950 p-0.5">
            <button
              onClick={() => setEditorMode("text")}
              className={`p-1 rounded transition-colors ${
                editorMode === "text"
                  ? "bg-emerald-500/20 text-emerald-300 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
              title="Visual Text Mode (No LaTeX)"
            >
              <AlignLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setEditorMode("code")}
              className={`p-1 rounded transition-colors ${
                editorMode === "code"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
              title="Raw LaTeX Code Mode"
            >
              <Code2 className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="hidden xs:flex items-center gap-1.5 pr-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            <span className="font-mono text-zinc-400 font-medium text-[11px]">
              {editorMode === "text" ? "text" : "latex"}
            </span>
          </div>

          {/* Upload / Import Resume Icon Button */}
          {onOpenImport && (
            <button
              onClick={onOpenImport}
              className="flex items-center justify-center h-7 w-7 rounded-md border border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-emerald-500/40 hover:bg-zinc-800 hover:text-emerald-400 transition-all touch-manipulation"
              title="Upload Resume (PDF, DOCX) or Load ATS Templates"
            >
              <Upload className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Compile Icon Button */}
          {onCompile && (
            <button
              onClick={onCompile}
              disabled={isCompiling}
              className="flex items-center justify-center h-7 w-7 rounded-md bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25 transition-all disabled:opacity-50 touch-manipulation"
              title="Compile PDF (⌘S / Ctrl+S)"
            >
              {isCompiling ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5 fill-emerald-400" />
              )}
            </button>
          )}

          {/* Undo / Redo Icon Buttons */}
          <div className="flex items-center rounded-md border border-zinc-800 bg-zinc-900/90 p-0.5">
            <button
              onClick={handleUndo}
              className="p-1 rounded text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors touch-manipulation"
              title="Undo (⌘Z / Ctrl+Z)"
            >
              <Undo2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleRedo}
              className="p-1 rounded text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors touch-manipulation"
              title="Redo (⌘⇧Z / Ctrl+Y)"
            >
              <Redo2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Right: View Modes (Icons) + ATS Score (Icon+Number) + Copilot (The Only Text Button) + Copy Icon */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* View Mode Switcher (Icons Only) */}
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

          {/* ATS Score (Icon + Number Only) */}
          {onOpenScore && (
            <button
              onClick={onOpenScore}
              className="flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-950/30 px-2 py-1 text-[11px] font-mono font-bold text-emerald-400 hover:bg-emerald-900/40 transition-colors shadow-sm"
              title="ATS Match Score (Click for diagnostics)"
            >
              <TrendingUp className="h-3 w-3 text-emerald-400" />
              <span>{liveAtsScore ? `${liveAtsScore}%` : "39%"}</span>
            </button>
          )}

          {/* Copilot (The ONLY button with text) */}
          {onToggleAi && (
            <button
              onClick={onToggleAi}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                isAiOpen
                  ? "bg-indigo-500 text-white shadow-sm"
                  : "bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/25"
              }`}
              title="Toggle LaTeX AI Copilot (Includes Auto-Boost)"
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              <span>Copilot</span>
            </button>
          )}

          {/* Copy Icon Button */}
          <button
            onClick={handleCopy}
            title="Copy LaTeX source code"
            className="flex items-center justify-center h-7 w-7 rounded-md border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Editor Body: Visual Text Mode OR Raw Monaco LaTeX Mode */}
      <div className="relative flex-1 min-h-[450px]">
        {editorMode === "text" ? (
          <VisualResumeEditor
            latexCode={code}
            onChange={onChange}
            onCompile={onCompile}
          />
        ) : (
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
        )}

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
