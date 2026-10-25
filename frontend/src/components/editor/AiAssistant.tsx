"use client";

import React, { useState } from "react";
import { 
  Sparkles, 
  Send, 
  Check, 
  ArrowRight, 
  Wand2, 
  Maximize2, 
  Minimize2, 
  Zap, 
  X,
  History
} from "lucide-react";
import { chatEditResume } from "@/lib/api";

interface AiAssistantProps {
  currentLatex: string;
  onApplyChange: (newLatex: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_ACTIONS = [
  "Tighten margins to strictly fit single page",
  "Rewrite bullets with Google X-Y-Z formula",
  "Quantify latency, RPS and throughput metrics",
  "Align experience toward Distributed Systems Lead",
  "Highlight open source contributions and patents"
];

export default function AiAssistant({
  currentLatex,
  onApplyChange,
  isOpen,
  onClose,
}: AiAssistantProps) {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastDiff, setLastDiff] = useState<{
    explanation: string;
    changes: string[];
    updatedLatex: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (customPrompt?: string) => {
    const text = customPrompt || prompt;
    if (!text.trim() || isLoading) return;

    try {
      setIsLoading(true);
      const res = await chatEditResume({
        current_latex: currentLatex,
        instruction: text,
      });

      setLastDiff({
        explanation: res.explanation,
        changes: res.changes,
        updatedLatex: res.updated_latex,
      });
      setPrompt("");
    } catch (e: any) {
      alert("AI Assistant error: " + (e.message || e));
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (!lastDiff) return;
    onApplyChange(lastDiff.updatedLatex);
    setLastDiff(null);
  };

  return (
    <div className="flex h-full flex-col border-l border-zinc-800 bg-zinc-950/95 backdrop-blur-xl w-80 lg:w-96 shadow-2xl">
      {/* Drawer Header */}
      <div className="flex h-10 items-center justify-between border-b border-zinc-800 px-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-semibold text-zinc-200">LaTeX AI Copilot</span>
        </div>
        <button
          onClick={onClose}
          className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Quick Suggestion Chips */}
        <div>
          <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
            Quick In-Editor Actions
          </span>
          <div className="mt-2 flex flex-col gap-1.5">
            {QUICK_ACTIONS.map((action, i) => (
              <button
                key={i}
                onClick={() => handleSubmit(action)}
                disabled={isLoading}
                className="group flex items-center justify-between rounded-lg border border-zinc-800/80 bg-zinc-900/60 px-3 py-2 text-left text-xs text-zinc-300 hover:border-emerald-500/40 hover:bg-zinc-900 hover:text-emerald-300 transition-all disabled:opacity-50"
              >
                <span>{action}</span>
                <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400" />
              </button>
            ))}
          </div>
        </div>

        {/* Diff Result Card */}
        {lastDiff && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 space-y-3 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs">
              <Zap className="h-3.5 w-3.5" />
              <span>Proposed Refinements</span>
            </div>
            <p className="text-zinc-300 text-xs leading-relaxed">
              {lastDiff.explanation}
            </p>
            <div className="space-y-1">
              {lastDiff.changes.map((c, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[11px] text-zinc-400">
                  <Check className="h-3 w-3 text-emerald-400 mt-0.5 shrink-0" />
                  <span>{c}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-emerald-500/20">
              <button
                onClick={handleApply}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-md bg-emerald-500 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 transition-colors shadow-sm"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Apply to Resume</span>
              </button>
              <button
                onClick={() => setLastDiff(null)}
                className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
              >
                Discard
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Input Box */}
      <div className="border-t border-zinc-800 p-3 bg-zinc-900/60">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="relative"
        >
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Ask AI: e.g. 'Add a bullet in Projects detailing Raft consensus algorithm'..."
            rows={3}
            className="w-full resize-none rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 pr-10 text-xs text-zinc-200 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={!prompt.trim() || isLoading}
            className="absolute bottom-3 right-2.5 rounded-md bg-emerald-500 p-1.5 text-zinc-950 hover:bg-emerald-400 disabled:opacity-40 transition-colors"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
        <span className="mt-1 block text-[10px] text-zinc-500 font-mono">
          Press Enter to apply prompt directly to LaTeX source.
        </span>
      </div>
    </div>
  );
}
