"use client";

import React, { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Check, Sparkles, AlertCircle, Copy, RotateCcw, ShieldAlert } from "lucide-react";
import { cleanLatex } from "@/lib/latex-utils";

// Dynamic import of Monaco to prevent SSR issues
const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface LatexEditorProps {
  code: string;
  onChange: (value: string) => void;
  onSave?: () => void;
  errors?: Array<{ line: string | number; message: string }>;
  isCompiling?: boolean;
}

export default function LatexEditor({
  code,
  onChange,
  onSave,
  errors = [],
  isCompiling = false,
}: LatexEditorProps) {
  const [copied, setCopied] = React.useState(false);
  const [emDashCount, setEmDashCount] = React.useState(0);

  useEffect(() => {
    const { emDashesReplaced } = cleanLatex(code);
    setEmDashCount(emDashesReplaced);
  }, [code]);

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
      <div className="flex h-10 items-center justify-between border-b border-zinc-800/80 bg-zinc-900/60 px-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            <span className="font-mono text-zinc-300 font-medium">resume.tex</span>
          </div>
          <span className="text-zinc-500 font-mono">
            {lineCount} lines
          </span>
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
            title="Copy LaTeX"
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
          onChange={(val) => onChange(val || "")}
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
