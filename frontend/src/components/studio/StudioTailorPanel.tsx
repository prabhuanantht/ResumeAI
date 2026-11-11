"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Target, 
  Sparkles, 
  Building2, 
  Briefcase, 
  Link as LinkIcon, 
  Loader2, 
  Check, 
  Plus, 
  RotateCcw, 
  TrendingUp, 
  ShieldCheck, 
  ArrowRight,
  AlertCircle,
  FileText
} from "lucide-react";
import confetti from "canvas-confetti";
import { 
  generateTailoredResume, 
  scrapeJobUrl, 
  scoreResume, 
  setStoredTargetJd, 
  getStoredTargetJd,
  TailorResponse, 
  AtsBreakdown, 
  SkillGapItem 
} from "@/lib/api";

interface StudioTailorPanelProps {
  currentLatex: string;
  onApplyTailored: (newLatex: string, summary?: string[]) => void;
  onUndoTailor?: () => void;
  canUndo?: boolean;
  onSwitchToEditor?: () => void;
  onSwitchToCopilot?: () => void;
}

export default function StudioTailorPanel({
  currentLatex,
  onApplyTailored,
  onUndoTailor,
  canUndo = false,
  onSwitchToEditor,
  onSwitchToCopilot,
}: StudioTailorPanelProps) {
  const [jobTitle, setJobTitle] = useState("Staff Software Engineer");
  const [company, setCompany] = useState("Target Company");
  const [jobUrl, setJobUrl] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [isScraping, setIsScraping] = useState(false);
  const [isTailoring, setIsTailoring] = useState(false);
  const [isScoring, setIsScoring] = useState(false);

  const [atsBreakdown, setAtsBreakdown] = useState<AtsBreakdown | null>(null);
  const [tailorResult, setTailorResult] = useState<TailorResponse | null>(null);
  const [confirmedSkills, setConfirmedSkills] = useState<string[]>([]);

  // Load saved JD from storage if available
  useEffect(() => {
    const savedJd = getStoredTargetJd();
    if (savedJd && !jobDescription) {
      setJobDescription(savedJd);
    }
  }, []);

  // Compute live match score whenever JD or currentLatex changes
  const runLiveScoring = useCallback(async (jdText: string, latex: string) => {
    if (!jdText.trim() || !latex.trim()) return;
    try {
      setIsScoring(true);
      const breakdown = await scoreResume({
        latex_code: latex,
        job_description: jdText,
      });
      setAtsBreakdown(breakdown);
    } catch (e) {
      console.error("Failed to score resume against JD:", e);
    } finally {
      setIsScoring(false);
    }
  }, []);

  useEffect(() => {
    if (jobDescription.trim().length > 30) {
      const timer = setTimeout(() => {
        runLiveScoring(jobDescription, currentLatex);
        setStoredTargetJd(jobDescription);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [jobDescription, currentLatex, runLiveScoring]);

  const handleScrape = async () => {
    if (!jobUrl.trim()) return;
    try {
      setIsScraping(true);
      const data = await scrapeJobUrl(jobUrl);
      if (data.job_title) setJobTitle(data.job_title);
      if (data.company) setCompany(data.company);
      if (data.description) {
        setJobDescription(data.description);
        runLiveScoring(data.description, currentLatex);
      }
    } catch (e: any) {
      alert("Failed to scrape job link: " + (e.message || e));
    } finally {
      setIsScraping(false);
    }
  };

  const handleExecuteTailoring = async (additionalSkills?: string[]) => {
    if (!jobDescription.trim() || isTailoring) return;
    try {
      setIsTailoring(true);
      const skillsToConfirm = additionalSkills || confirmedSkills;

      const res = await generateTailoredResume({
        job_title: jobTitle,
        company: company,
        job_description: jobDescription,
        job_url: jobUrl,
        base_latex: currentLatex,
        confirmed_skills: skillsToConfirm,
      });

      setTailorResult(res);
      setAtsBreakdown(res.ats_breakdown);
      onApplyTailored(res.tailored_latex, res.diff_summary);

      if (res.ats_score >= 80) {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.5 },
          colors: ["#10b981", "#14b8a6", "#3b82f6"],
        });
      }
    } catch (e: any) {
      alert("Tailoring failed: " + (e.message || e));
    } finally {
      setIsTailoring(false);
    }
  };

  const handleAddSkill = (skill: string) => {
    if (confirmedSkills.includes(skill)) return;
    const updated = [...confirmedSkills, skill];
    setConfirmedSkills(updated);
    handleExecuteTailoring(updated);
  };

  const score = atsBreakdown?.overall_score ?? null;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl">
      {/* Header */}
      <div className="flex h-10 items-center justify-between border-b border-zinc-800/80 bg-zinc-900/60 px-3 text-xs shrink-0 select-none">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-teal-400" />
          <span className="font-semibold text-zinc-200">Job Tailoring & ATS Match</span>
          <span className="rounded-full bg-teal-500/10 border border-teal-500/30 px-2 py-0.2 text-[10px] font-mono text-teal-300">
            AI Optimizer
          </span>
        </div>

        <div className="flex items-center gap-2">
          {canUndo && onUndoTailor && (
            <button
              onClick={onUndoTailor}
              className="flex items-center gap-1 rounded border border-amber-500/40 bg-amber-950/20 px-2 py-0.5 text-[11px] font-mono text-amber-300 hover:bg-amber-900/30 transition-colors"
              title="Revert to resume before tailoring"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Undo Tailor</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4 text-xs">
        {/* ATS Score Meter Card */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-teal-400" />
              <span className="font-semibold text-zinc-200">ATS Match Diagnostic</span>
              {isScoring && <Loader2 className="h-3 w-3 animate-spin text-teal-400" />}
            </div>
            {score !== null ? (
              <span className={`font-mono text-sm font-bold ${
                score >= 80 ? "text-emerald-400" : score >= 60 ? "text-amber-400" : "text-rose-400"
              }`}>
                {score}% Match
              </span>
            ) : (
              <span className="font-mono text-xs text-zinc-500">Paste JD to score</span>
            )}
          </div>

          {atsBreakdown && (
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-lg bg-zinc-950/80 p-2 border border-zinc-800/80">
                <span className="text-zinc-400 block text-[10px]">Keyword Match</span>
                <span className="font-mono font-bold text-teal-300">{atsBreakdown.keyword_match_score}%</span>
              </div>
              <div className="rounded-lg bg-zinc-950/80 p-2 border border-zinc-800/80">
                <span className="text-zinc-400 block text-[10px]">Quantifiable Impact</span>
                <span className="font-mono font-bold text-emerald-300">{atsBreakdown.impact_metrics_score}%</span>
              </div>
            </div>
          )}
        </div>

        {/* 1-Click Tailor Action Card */}
        <button
          onClick={() => handleExecuteTailoring()}
          disabled={!jobDescription.trim() || isTailoring}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-zinc-950 font-bold py-2.5 text-xs transition-all shadow-lg active:scale-[0.98] disabled:opacity-40"
        >
          {isTailoring ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-zinc-950" />
              <span>Tailoring Resume & Aligning Keywords...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 fill-current" />
              <span>Tailor Resume for this Job Now</span>
            </>
          )}
        </button>

        {/* Tailor Result Summary Banner */}
        {tailorResult && (
          <div className="rounded-xl border border-teal-500/40 bg-teal-950/30 p-3 space-y-2 animate-in fade-in">
            <div className="flex items-center gap-1.5 text-teal-300 font-bold text-xs">
              <Check className="h-4 w-4 text-teal-400" />
              <span>Resume Successfully Tailored!</span>
            </div>
            <ul className="space-y-1 text-[11px] text-zinc-300 list-disc list-inside">
              {tailorResult.diff_summary.slice(0, 4).map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Job Inputs */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-zinc-400 font-medium block mb-1">
                Target Role
              </label>
              <div className="relative">
                <Briefcase className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior Backend Engineer"
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-2 pl-8 pr-2 text-xs text-zinc-200 placeholder-zinc-500 focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] text-zinc-400 font-medium block mb-1">
                Company
              </label>
              <div className="relative">
                <Building2 className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Stripe, Google"
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-2 pl-8 pr-2 text-xs text-zinc-200 placeholder-zinc-500 focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Job URL Scraper */}
          <div>
            <label className="text-[11px] text-zinc-400 font-medium block mb-1">
              Job Posting URL (Optional Auto-Fill)
            </label>
            <div className="flex gap-1.5">
              <div className="relative flex-1">
                <LinkIcon className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                <input
                  type="url"
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  placeholder="Paste LinkedIn, Greenhouse, or Lever link..."
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-2 pl-8 pr-2 text-xs text-zinc-200 placeholder-zinc-500 focus:border-teal-500 focus:outline-none"
                />
              </div>
              <button
                onClick={handleScrape}
                disabled={!jobUrl.trim() || isScraping}
                className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 disabled:opacity-40 transition-colors"
              >
                {isScraping ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Fetch"}
              </button>
            </div>
          </div>

          {/* Job Description Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] text-zinc-400 font-medium">
                Job Description Requirements
              </label>
              <span className="font-mono text-[10px] text-zinc-500">
                {jobDescription.length} chars
              </span>
            </div>
            <textarea
              rows={6}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste job description requirements, responsibilities, and required qualifications here..."
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-zinc-200 placeholder-zinc-500 focus:border-teal-500 focus:outline-none font-mono leading-relaxed resize-none"
            />
          </div>
        </div>

        {/* Missing Keywords & Skills Gap Detection */}
        {atsBreakdown && atsBreakdown.missing_keywords && atsBreakdown.missing_keywords.length > 0 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-rose-300 font-semibold text-xs">
                <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
                <span>Detected Skill Gaps ({atsBreakdown.missing_keywords.length})</span>
              </div>
              <span className="text-[10px] text-zinc-500">Click to add to resume</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {atsBreakdown.missing_keywords.map((kw, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAddSkill(kw)}
                  className="flex items-center gap-1 rounded-md border border-rose-500/30 bg-rose-950/20 px-2 py-0.5 text-[11px] text-rose-300 hover:border-emerald-500/40 hover:bg-emerald-950/30 hover:text-emerald-300 transition-colors"
                  title={`Add ${kw} into resume Technical Skills and re-tailor`}
                >
                  <Plus className="h-2.5 w-2.5" />
                  <span>{kw}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Matched Keywords */}
        {atsBreakdown && atsBreakdown.matched_keywords && atsBreakdown.matched_keywords.length > 0 && (
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs">
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span>Matched ATS Keywords ({atsBreakdown.matched_keywords.length})</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {atsBreakdown.matched_keywords.map((kw, idx) => (
                <span
                  key={idx}
                  className="rounded-md border border-emerald-500/30 bg-emerald-950/20 px-2 py-0.5 text-[11px] text-emerald-300"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
