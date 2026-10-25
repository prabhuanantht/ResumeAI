"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  TrendingUp, 
  Zap, 
  RefreshCw,
  HelpCircle,
  FileText
} from "lucide-react";
import confetti from "canvas-confetti";
import { scoreResume, AtsBreakdown } from "@/lib/api";

interface ResumeScorerDrawerProps {
  latexCode: string;
  isOpen: boolean;
  onClose: () => void;
  onQuickAiFix?: (instruction: string) => void;
  onScoreUpdated?: (score: number) => void;
}

export default function ResumeScorerDrawer({
  latexCode,
  isOpen,
  onClose,
  onQuickAiFix,
  onScoreUpdated,
}: ResumeScorerDrawerProps) {
  const [breakdown, setBreakdown] = useState<AtsBreakdown | null>(null);
  const [targetJd, setTargetJd] = useState<string>("");
  const [isScoring, setIsScoring] = useState(false);

  const runScore = async (jdText?: string) => {
    if (!latexCode.trim()) return;
    try {
      setIsScoring(true);
      const res = await scoreResume({
        latex_code: latexCode,
        job_description: jdText !== undefined ? jdText : targetJd,
      });
      setBreakdown(res);
      if (onScoreUpdated) {
        onScoreUpdated(res.overall_score);
      }
      if (res.overall_score >= 85) {
        confetti({
          particleCount: 30,
          spread: 50,
          origin: { y: 0.6 },
          colors: ["#10b981", "#6366f1", "#f59e0b"],
        });
      }
    } catch (e: any) {
      console.error("Score error:", e);
    } finally {
      setIsScoring(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runScore();
    }
  }, [isOpen, latexCode]);

  if (!isOpen) return null;

  let scoreColor = "text-emerald-400";
  let scoreBorder = "border-emerald-500/40";
  let scoreBg = "bg-emerald-950/30";
  let gradeBadge = "Top 5% Candidate Fit";

  if (breakdown) {
    if (breakdown.overall_score < 60) {
      scoreColor = "text-rose-400";
      scoreBorder = "border-rose-500/40";
      scoreBg = "bg-rose-950/30";
      gradeBadge = "Critical Keyword Gaps";
    } else if (breakdown.overall_score < 80) {
      scoreColor = "text-amber-400";
      scoreBorder = "border-amber-500/40";
      scoreBg = "bg-amber-950/30";
      gradeBadge = "Moderate Alignment";
    }
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-zinc-800 bg-zinc-950/95 backdrop-blur-xl shadow-2xl animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex h-12 items-center justify-between border-b border-zinc-800 px-4 bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-400" />
          <h3 className="text-xs font-bold text-white tracking-wide uppercase font-mono">
            Live Resume ATS Diagnostic
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => runScore()}
            disabled={isScoring}
            className="flex items-center gap-1 rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-300 hover:text-white"
            title="Recalculate Score"
          >
            <RefreshCw className={`h-3 w-3 ${isScoring ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={onClose}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
        {/* Score Meter Banner */}
        {breakdown && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                  ATS Match Score
                </span>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className={`text-4xl font-extrabold font-mono tracking-tight ${scoreColor}`}>
                    {breakdown.overall_score}
                  </span>
                  <span className="text-zinc-500 font-mono text-xs">/ 100</span>
                </div>
                <span className={`inline-block mt-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${scoreBorder} ${scoreBg} ${scoreColor}`}>
                  {gradeBadge}
                </span>
              </div>

              {/* Quick AI fix button */}
              {onQuickAiFix && (
                <button
                  onClick={() => onQuickAiFix("Rewrite bullet points to maximize ATS keywords and quantifiable metrics")}
                  className="flex flex-col items-center gap-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-2.5 text-emerald-400 hover:bg-emerald-500/20 transition-all text-center"
                >
                  <Sparkles className="h-4 w-4 text-emerald-400" />
                  <span className="text-[10px] font-bold">Auto-Boost</span>
                </button>
              )}
            </div>

            {/* Sub-Scores Bar Grid */}
            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-zinc-800 pt-3">
              <div className="rounded-lg bg-zinc-950/80 p-2 border border-zinc-800/80">
                <div className="flex justify-between text-[11px] text-zinc-300">
                  <span>Impact Metrics</span>
                  <span className="font-mono text-emerald-400 font-bold">{breakdown.impact_metrics_score}%</span>
                </div>
                <div className="mt-1.5 h-1 w-full rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-emerald-400"
                    style={{ width: `${breakdown.impact_metrics_score}%` }}
                  />
                </div>
              </div>

              <div className="rounded-lg bg-zinc-950/80 p-2 border border-zinc-800/80">
                <div className="flex justify-between text-[11px] text-zinc-300">
                  <span>Action Verbs</span>
                  <span className="font-mono text-emerald-400 font-bold">{breakdown.action_verbs_score}%</span>
                </div>
                <div className="mt-1.5 h-1 w-full rounded-full bg-emerald-400" style={{ width: `${breakdown.action_verbs_score}%` }} />
              </div>

              <div className="rounded-lg bg-zinc-950/80 p-2 border border-zinc-800/80">
                <div className="flex justify-between text-[11px] text-zinc-300">
                  <span>Typography & 0 Em Dashes</span>
                  <span className="font-mono text-emerald-400 font-bold">{breakdown.formatting_hygiene_score}%</span>
                </div>
                <div className="mt-1.5 h-1 w-full rounded-full bg-emerald-400" style={{ width: `${breakdown.formatting_hygiene_score}%` }} />
              </div>

              <div className="rounded-lg bg-zinc-950/80 p-2 border border-zinc-800/80">
                <div className="flex justify-between text-[11px] text-zinc-300">
                  <span>Keyword Density</span>
                  <span className="font-mono text-emerald-400 font-bold">{breakdown.keyword_match_score}%</span>
                </div>
                <div className="mt-1.5 h-1 w-full rounded-full bg-emerald-400" style={{ width: `${breakdown.keyword_match_score}%` }} />
              </div>
            </div>
          </div>
        )}

        {/* Optional Target Job Description Benchmarking */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-200 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-emerald-400" />
              Target Job Keyword Benchmark
            </span>
            {targetJd && (
              <button
                onClick={() => {
                  setTargetJd("");
                  runScore("");
                }}
                className="text-[10px] text-zinc-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>
          <textarea
            value={targetJd}
            onChange={(e) => setTargetJd(e.target.value)}
            placeholder="Paste target job description to match keywords specifically against that role..."
            rows={3}
            className="w-full resize-none rounded-lg border border-zinc-800 bg-zinc-950 p-2 text-xs text-zinc-200 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
          />
          <button
            onClick={() => runScore(targetJd)}
            disabled={isScoring || !targetJd.trim()}
            className="w-full rounded-md bg-zinc-800 hover:bg-zinc-700 py-1.5 text-[11px] font-semibold text-zinc-200 transition-colors disabled:opacity-40"
          >
            Calculate Match Against This Role
          </button>
        </div>

        {/* Matched vs Missing Keywords */}
        {breakdown && (
          <div className="space-y-3">
            <div>
              <span className="text-[11px] font-semibold text-zinc-300 block mb-1.5">
                Matched Core Competencies ({breakdown.matched_keywords.length})
              </span>
              <div className="flex flex-wrap gap-1">
                {breakdown.matched_keywords.map((kw, i) => (
                  <span
                    key={i}
                    className="rounded bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 font-mono text-[10px] text-emerald-300"
                  >
                    ✓ {kw}
                  </span>
                ))}
              </div>
            </div>

            {breakdown.missing_keywords.length > 0 && (
              <div>
                <span className="text-[11px] font-semibold text-amber-300 block mb-1.5">
                  Missing Target Keywords ({breakdown.missing_keywords.length})
                </span>
                <div className="flex flex-wrap gap-1">
                  {breakdown.missing_keywords.map((kw, i) => (
                    <span
                      key={i}
                      className="rounded bg-amber-950/30 border border-amber-500/30 px-2 py-0.5 font-mono text-[10px] text-amber-300"
                    >
                      + {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recruiter Hygiene Checklist */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-1">
                Hygiene & ATS Best Practices
              </span>
              {breakdown.feedback_notes.map((note, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[11px] text-zinc-300">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
                  <span>{note}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
