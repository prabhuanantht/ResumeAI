"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { 
  Check, 
  Copy, 
  ShieldAlert, 
  Undo2, 
  Redo2, 
  AlertCircle 
} from "lucide-react";
import { cleanLatex } from "@/lib/latex-utils";

// Dynamic import of Monaco to prevent SSR issues
const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface LatexEditorProps {
  code: string;
  onChange: (value: string) => void;
  onSave?: () => void;
  errors?: Array<{ line: string | number; message: string }>;
  isCompiling?: boolean;
  targetLine?: number | null;
  targetLabel?: string | null;
}

export default function LatexEditor({
  code,
  onChange,
  onSave,
  errors = [],
  isCompiling = false,
  targetLine = null,
  targetLabel = null,
}: LatexEditorProps) {
  const [copied, setCopied] = useState(false);
  const [emDashCount, setEmDashCount] = useState(0);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);
  const isInternalChangeRef = useRef(false);

  useEffect(() => {
    const { emDashesReplaced } = cleanLatex(code);
    setEmDashCount(emDashesReplaced);
  }, [code]);

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

  // Handle SyncTeX Click-to-Source from PDF preview
  useEffect(() => {
    if (targetLine && editorRef.current && monacoRef.current) {
      editorRef.current.revealLineInCenter(targetLine);
      editorRef.current.setPosition({ lineNumber: targetLine, column: 1 });
      editorRef.current.focus();

      // Flash emerald highlight decoration
      decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, [
        {
          range: new monacoRef.current.Range(targetLine, 1, targetLine, 1),
          options: {
            isWholeLine: true,
            className: "bg-emerald-500/25 border-l-4 border-emerald-400 font-semibold",
          },
        },
      ]);

      const timer = setTimeout(() => {
        if (editorRef.current) {
          decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, []);
        }
      }, 2500);

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

  const handleFixEmDashes = () => {
    const { cleaned } = cleanLatex(code);
    onChange(cleaned);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lineCount = code.split("\n").length;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl">
      {/* Editor Sub-header */}
      <div className="flex h-10 items-center justify-between border-b border-zinc-800/80 bg-zinc-900/60 px-3 sm:px-4 text-xs">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            <span className="font-mono text-zinc-300 font-medium">resume.tex</span>
          </div>

          <span className="text-zinc-500 font-mono text-[11px]">
            {lineCount} lines
          </span>

          {/* Undo / Redo Toolbar Controls */}
          <div className="flex items-center rounded-md border border-zinc-800 bg-zinc-900/90 p-0.5 ml-1">
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

        {/* Em Dash Hygiene and Actions */}
        <div className="flex items-center gap-2">
          {emDashCount > 0 ? (
            <button
              onClick={handleFixEmDashes}
              className="flex items-center gap-1.5 rounded bg-amber-500/10 border border-amber-500/30 px-2 py-1 text-[11px] font-mono text-amber-300 hover:bg-amber-500/20 transition-colors"
            >
              <ShieldAlert className="h-3 w-3" />
              <span>Strip {emDashCount} Em Dashes</span>
            </button>
          ) : (
            <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-zinc-500">
              <span>0 em dashes</span>
            </div>
          )}

          <button
            onClick={handleCopy}
            title="Copy LaTeX source code"
            className="flex items-center gap-1 rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            <span className="text-[11px]">{copied ? "Copied" : "Copy"}</span>
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
