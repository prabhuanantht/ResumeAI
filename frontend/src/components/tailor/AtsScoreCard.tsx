"use client";

import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import { 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  ShieldCheck, 
  Zap, 
  Hash, 
  HelpCircle,
  ExternalLink
} from "lucide-react";
import { AtsBreakdown } from "@/lib/api";

interface AtsScoreCardProps {
  score: number;
  breakdown: AtsBreakdown;
  onSkillClick?: (skill: string) => void;
}

export default function AtsScoreCard({
  score,
  breakdown,
  onSkillClick,
}: AtsScoreCardProps) {
  useEffect(() => {
    if (score >= 85) {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#10b981", "#6366f1", "#f59e0b"],
      });
    }
  }, [score]);

  // Determine grade and color
  let scoreColor = "text-emerald-400";
  let scoreBorder = "border-emerald-500/40";
  let scoreBg = "bg-emerald-950/20";
  let gradeBadge = "Top 5% Candidate Fit";

  if (score < 60) {
    scoreColor = "text-rose-400";
    scoreBorder = "border-rose-500/40";
    scoreBg = "bg-rose-950/20";
    gradeBadge = "Critical Keyword Gaps";
  } else if (score < 80) {
    scoreColor = "text-amber-400";
    scoreBorder = "border-amber-500/40";
    scoreBg = "bg-amber-950/20";
    gradeBadge = "Moderate Alignment";
  }

  const subScores = [
    {
      label: "Keyword Coverage",
      val: breakdown.keyword_match_score,
      desc: `${breakdown.matched_keywords.length} of ${breakdown.matched_keywords.length + breakdown.missing_keywords.length} JD skills found`,
    },
    {
      label: "Quantifiable Impact",
      val: breakdown.impact_metrics_score,
      desc: "Measured achievements (%, $, latency, scale)",
    },
    {
      label: "Action Verbs",
      val: breakdown.action_verbs_score,
      desc: "Google X-Y-Z active verbs, zero filler clichés",
    },
    {
      label: "Typography Hygiene",
      val: breakdown.formatting_hygiene_score,
      desc: `${breakdown.detected_em_dashes === 0 ? "0 em dashes (Perfect TeX standard)" : `${breakdown.detected_em_dashes} em dashes detected`}`,
    },
  ];

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/90 p-5 shadow-2xl backdrop-blur-sm space-y-6">
      {/* Header with Circular Score Meter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-zinc-500 uppercase tracking-widest">
              ATS Match Analysis
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${scoreBorder} ${scoreBg} ${scoreColor}`}>
              {gradeBadge}
            </span>
          </div>
          <h3 className="mt-1 text-lg font-bold text-white tracking-tight">
            Resume Match Diagnostic
          </h3>
          <p className="text-xs text-zinc-400">
            Validated against recruiter ATS parsers (Lever, Greenhouse, Workday).
          </p>
        </div>

        {/* Large Score Dial */}
        <div className="flex items-center gap-4">
          <div className={`relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border ${scoreBorder} ${scoreBg} shadow-inner`}>
            <div className="text-center">
              <span className={`font-mono text-3xl font-extrabold tracking-tighter ${scoreColor}`}>
                {score}
              </span>
              <span className="block text-[9px] font-mono text-zinc-500">/ 100</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Metric Sub-Scores Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {subScores.map((item, i) => (
          <div
            key={i}
            className="rounded-xl border border-zinc-800/90 bg-zinc-900/40 p-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-xs font-medium text-zinc-300">
                <span>{item.label}</span>
                <span className="font-mono text-emerald-400 font-semibold">{item.val}%</span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500 ease-out"
                  style={{ width: `${Math.min(100, item.val)}%` }}
                />
              </div>
            </div>
            <span className="mt-2 text-[10px] text-zinc-400 leading-tight">
              {item.desc}
            </span>
          </div>
        ))}
      </div>

      {/* Keywords Breakdown Pills */}
      <div className="space-y-4">
        {/* Matched Keywords */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 mb-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Target Keywords Matched ({breakdown.matched_keywords.length})</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {breakdown.matched_keywords.map((kw, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-950/30 px-2 py-1 text-[11px] font-mono text-emerald-300"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {kw}
              </span>
            ))}
            {breakdown.matched_keywords.length === 0 && (
              <span className="text-xs text-zinc-500 italic">No exact tech keywords matched yet.</span>
            )}
          </div>
        </div>

        {/* Missing Keywords / Skills */}
        {breakdown.missing_keywords.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 mb-2">
              <AlertCircle className="h-4 w-4 text-amber-400" />
              <span>Missing High-Priority JD Keywords ({breakdown.missing_keywords.length})</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {breakdown.missing_keywords.map((kw, idx) => (
                <button
                  key={idx}
                  onClick={() => onSkillClick && onSkillClick(kw)}
                  title="Click to resolve this skill gap"
                  className="group inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-950/20 px-2 py-1 text-[11px] font-mono text-amber-300 hover:border-amber-400 hover:bg-amber-900/40 transition-all"
                >
                  <span>{kw}</span>
                  <HelpCircle className="h-3 w-3 text-amber-400/70 group-hover:text-amber-300" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recruiter Feedback & Next Actions */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-4">
        <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
          Recruiter Intelligence & Hygiene Log
        </span>
        <ul className="mt-2.5 space-y-1.5 text-xs text-zinc-300">
          {breakdown.feedback_notes.map((note, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
              <span>{note}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
