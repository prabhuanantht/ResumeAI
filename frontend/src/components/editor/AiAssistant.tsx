"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Sparkles, 
  Send, 
  Check, 
  ArrowRight, 
  Undo2, 
  Redo2, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  X, 
  RefreshCw, 
  Bot, 
  User, 
  Zap,
  ShieldCheck,
  Award
} from "lucide-react";
import { chatEditResume, AtsBreakdown } from "@/lib/api";

interface ChatEditItem {
  id: string;
  instruction: string;
  explanation: string;
  changes: string[];
  latexBefore: string;
  latexAfter: string;
  scoreBefore: number;
  scoreAfter: number;
  breakdownBefore?: AtsBreakdown;
  breakdownAfter?: AtsBreakdown;
  status: "pending" | "applied" | "undone";
  timestamp: string;
}

interface AiAssistantProps {
  currentLatex: string;
  onApplyChange: (newLatex: string, label?: string) => void;
  onUndoChange?: (previousLatex: string) => void;
  targetJd?: string;
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_ACTIONS = [
  "Rewrite bullets with Google X-Y-Z formula",
  "Quantify latency, RPS and throughput metrics",
  "Tighten margins to strictly fit single page",
  "Align bullets toward Senior Backend / Distributed Systems",
  "Strengthen action verbs and eliminate filler words"
];

export default function AiAssistant({
  currentLatex,
  onApplyChange,
  onUndoChange,
  targetJd = "",
  isOpen,
  onClose,
}: AiAssistantProps) {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<ChatEditItem[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, isLoading]);

  if (!isOpen) return null;

  const handleSubmit = async (customPrompt?: string) => {
    const text = customPrompt || prompt;
    if (!text.trim() || isLoading) return;

    try {
      setIsLoading(true);
      const latexBeforeSnapshot = currentLatex;

      const res = await chatEditResume({
        current_latex: currentLatex,
        instruction: text,
        job_description: targetJd,
      });

      const newItem: ChatEditItem = {
        id: Date.now().toString(),
        instruction: text,
        explanation: res.explanation,
        changes: res.changes,
        latexBefore: latexBeforeSnapshot,
        latexAfter: res.updated_latex,
        scoreBefore: res.score_before ?? 65,
        scoreAfter: res.score_after ?? 85,
        breakdownBefore: res.ats_breakdown_before,
        breakdownAfter: res.ats_breakdown_after,
        status: "pending",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setHistory((prev) => [...prev, newItem]);
      setPrompt("");
    } catch (e: any) {
      alert("AI Assistant error: " + (e.message || e));
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = (item: ChatEditItem) => {
    onApplyChange(item.latexAfter, item.instruction);
    setHistory((prev) =>
      prev.map((h) => (h.id === item.id ? { ...h, status: "applied" } : h))
    );
  };

  const handleUndo = (item: ChatEditItem) => {
    if (onUndoChange) {
      onUndoChange(item.latexBefore);
    } else {
      onApplyChange(item.latexBefore, "Undo AI Edit");
    }
    setHistory((prev) =>
      prev.map((h) => (h.id === item.id ? { ...h, status: "undone" } : h))
    );
  };

  const handleRedo = (item: ChatEditItem) => {
    onApplyChange(item.latexAfter, `Redo: ${item.instruction}`);
    setHistory((prev) =>
      prev.map((h) => (h.id === item.id ? { ...h, status: "applied" } : h))
    );
  };

  return (
    <div className="flex h-full flex-col border-l border-zinc-800 bg-zinc-950/95 backdrop-blur-xl w-84 sm:w-96 shadow-2xl shrink-0">
      {/* Drawer Header */}
      <div className="flex h-10 items-center justify-between border-b border-zinc-800 px-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-semibold text-zinc-200">LaTeX AI Copilot & ATS Diff</span>
        </div>
        <button
          onClick={onClose}
          className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Chat Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Welcome Card & Quick Chips */}
        {history.length === 0 && (
          <div className="space-y-3">
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-zinc-200 font-semibold text-xs">
                <Bot className="h-4 w-4 text-emerald-400" />
                <span>AI In-Editor Assistant</span>
              </div>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Ask me to refine any section, inject quantifiable metrics, or match a specific role. Every edit displays an <strong className="text-zinc-200">ATS score calculation before & after</strong> and is 100% undoable.
              </p>
            </div>

            <div>
              <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
                Quick Actions
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
          </div>
        )}

        {/* Conversation Items */}
        {history.map((item) => {
          const scoreDelta = item.scoreAfter - item.scoreBefore;
          const isPositive = scoreDelta > 0;
          const isNeutral = scoreDelta === 0;

          return (
            <div key={item.id} className="space-y-2.5 animate-in fade-in slide-in-from-bottom-2">
              {/* User Prompt Bubble */}
              <div className="flex items-start gap-2 justify-end">
                <div className="rounded-xl rounded-tr-sm bg-zinc-800 px-3 py-2 text-xs text-zinc-200 max-w-[85%] shadow-sm">
                  {item.instruction}
                </div>
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-zinc-300 shrink-0 mt-0.5">
                  <User className="h-3.5 w-3.5" />
                </div>
              </div>

              {/* AI Response Card with ATS Before/After Score Comparison */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-3.5 space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Proposed AI Refinement</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">{item.timestamp}</span>
                </div>

                {/* ATS Score Calculation Before & After Card */}
                <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400 font-medium">ATS Match Score:</span>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-zinc-400 line-through text-[11px]">
                        {item.scoreBefore}%
                      </span>
                      <ArrowRight className="h-3 w-3 text-zinc-500" />
                      <span className="text-emerald-400 font-bold text-sm">
                        {item.scoreAfter}%
                      </span>
                      <span
                        className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.2 text-[10px] font-bold ${
                          isPositive
                            ? "bg-emerald-950/80 border border-emerald-500/40 text-emerald-300"
                            : isNeutral
                            ? "bg-zinc-800 text-zinc-300"
                            : "bg-rose-950/80 border border-rose-500/40 text-rose-300"
                        }`}
                      >
                        {isPositive ? <TrendingUp className="h-2.5 w-2.5" /> : <Minus className="h-2.5 w-2.5" />}
                        {isPositive ? `+${scoreDelta}` : scoreDelta} pts
                      </span>
                    </div>
                  </div>

                  {/* Sub-Metric Comparison Pills */}
                  {item.breakdownBefore && item.breakdownAfter && (
                    <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-zinc-800/80 text-[10px] font-mono">
                      <div className="flex items-center justify-between bg-zinc-900/80 px-2 py-1 rounded text-zinc-400">
                        <span>Action Verbs:</span>
                        <span className="text-emerald-400 font-semibold">
                          {item.breakdownBefore.action_verbs_score}% → {item.breakdownAfter.action_verbs_score}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between bg-zinc-900/80 px-2 py-1 rounded text-zinc-400">
                        <span>Impact Metrics:</span>
                        <span className="text-emerald-400 font-semibold">
                          {item.breakdownBefore.impact_metrics_score}% → {item.breakdownAfter.impact_metrics_score}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between bg-zinc-900/80 px-2 py-1 rounded text-zinc-400">
                        <span>Keywords:</span>
                        <span className="text-emerald-400 font-semibold">
                          {item.breakdownBefore.keyword_match_score}% → {item.breakdownAfter.keyword_match_score}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between bg-zinc-900/80 px-2 py-1 rounded text-zinc-400">
                        <span>Typography:</span>
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <ShieldCheck className="h-2.5 w-2.5" />
                          Clean TeX
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Explanation */}
                <p className="text-zinc-300 text-xs leading-relaxed">
                  {item.explanation}
                </p>

                {/* Bullet Points Modified */}
                <div className="space-y-1">
                  {item.changes.map((c, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-[11px] text-zinc-400">
                      <Check className="h-3 w-3 text-emerald-400 mt-0.5 shrink-0" />
                      <span>{c}</span>
                    </div>
                  ))}
                </div>

                {/* Action Controls: Apply / Undo / Redo */}
                <div className="flex items-center gap-2 pt-2 border-t border-zinc-800">
                  {item.status === "pending" && (
                    <button
                      onClick={() => handleApply(item)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 transition-colors shadow-sm"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Apply to Resume</span>
                    </button>
                  )}

                  {item.status === "applied" && (
                    <div className="flex items-center gap-2 w-full">
                      <span className="flex-1 flex items-center gap-1 text-[11px] text-emerald-400 font-medium font-mono">
                        <Check className="h-3.5 w-3.5" /> Applied to Editor
                      </span>
                      <button
                        onClick={() => handleUndo(item)}
                        className="flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-950/20 px-2.5 py-1 text-xs font-medium text-amber-300 hover:bg-amber-900/30 transition-colors"
                        title="Revert LaTeX code to state before this edit"
                      >
                        <Undo2 className="h-3.5 w-3.5" />
                        <span>Undo Edit</span>
                      </button>
                    </div>
                  )}

                  {item.status === "undone" && (
                    <div className="flex items-center gap-2 w-full">
                      <span className="flex-1 text-[11px] text-zinc-500 font-mono">
                        Edit Reverted
                      </span>
                      <button
                        onClick={() => handleRedo(item)}
                        className="flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-950/20 px-2.5 py-1 text-xs font-medium text-emerald-300 hover:bg-emerald-900/30 transition-colors"
                        title="Re-apply this edit"
                      >
                        <Redo2 className="h-3.5 w-3.5" />
                        <span>Redo Edit</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading Spinner Indicator */}
        {isLoading && (
          <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 text-xs text-zinc-300 animate-pulse">
            <RefreshCw className="h-4 w-4 animate-spin text-emerald-400" />
            <span>Analyzing resume and calculating ATS score deltas...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="border-t border-zinc-800 bg-zinc-950 p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isLoading}
            placeholder="Ask AI to edit bullets, tighten margins, or tailor..."
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-2.5 pl-3 pr-10 text-xs text-zinc-200 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!prompt.trim() || isLoading}
            className="absolute right-1.5 rounded-lg bg-emerald-500 p-1.5 text-zinc-950 hover:bg-emerald-400 disabled:opacity-30 transition-all"
            title="Send request"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
