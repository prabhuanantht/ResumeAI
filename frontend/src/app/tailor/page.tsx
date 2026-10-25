"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/navigation/Navbar";
import JobInputModal from "@/components/tailor/JobInputModal";
import AtsScoreCard from "@/components/tailor/AtsScoreCard";
import SkillGapDialog from "@/components/tailor/SkillGapDialog";
import { 
  generateTailoredResume, 
  compilePdf, 
  compileDocx, 
  setStoredDraft,
  setStoredTargetJd,
  TailorResponse, 
  SkillGapItem 
} from "@/lib/api";
import { downloadBlob, downloadText } from "@/lib/latex-utils";
import { 
  Sparkles, 
  ArrowRight, 
  FileText, 
  Download, 
  Code2, 
  FileType, 
  RotateCcw,
  Check,
  ChevronRight
} from "lucide-react";

export default function TailorPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [tailorResult, setTailorResult] = useState<TailorResponse | null>(null);
  const [confirmedSkills, setConfirmedSkills] = useState<string[]>([]);
  const [declinedSkills, setDeclinedSkills] = useState<string[]>([]);
  const [currentJd, setCurrentJd] = useState<string>("");
  const [currentJobTitle, setCurrentJobTitle] = useState<string>("");
  const [currentCompany, setCurrentCompany] = useState<string>("");

  const handleStartTailoring = async (data: {
    job_title: string;
    company: string;
    job_description: string;
    job_url: string;
    variance_level: string;
  }) => {
    try {
      setIsLoading(true);
      setCurrentJobTitle(data.job_title);
      setCurrentCompany(data.company);
      setCurrentJd(data.job_description);

      const res = await generateTailoredResume({
        job_title: data.job_title,
        company: data.company,
        job_description: data.job_description,
        job_url: data.job_url,
        variance_level: data.variance_level,
        confirmed_skills: confirmedSkills,
        declined_skills: declinedSkills,
      });

      setTailorResult(res);
      // Cache locally for immediate editing in Studio
      setStoredDraft(res.tailored_latex);
      setStoredTargetJd(currentJd);
    } catch (e: any) {
      alert("Tailoring failed: " + (e.message || e));
    } finally {
      setIsLoading(false);
    }
  };

  // When user confirms they know a missing skill
  const handleConfirmSkill = async (skill: string, userNote?: string) => {
    const updatedConfirmed = [...confirmedSkills, skill];
    setConfirmedSkills(updatedConfirmed);

    // Re-run tailoring with confirmed skill integrated
    try {
      setIsLoading(true);
      const res = await generateTailoredResume({
        job_title: currentJobTitle,
        company: currentCompany,
        job_description: currentJd,
        confirmed_skills: updatedConfirmed,
        declined_skills: declinedSkills,
      });
      setTailorResult(res);
      // Cache locally for immediate editing in Studio
      setStoredDraft(res.tailored_latex);
      setStoredTargetJd(currentJd);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeclineSkill = (skill: string) => {
    setDeclinedSkills((prev) => [...prev, skill]);
  };

  const handleDownloadPdf = async () => {
    if (!tailorResult) return;
    try {
      const blob = await compilePdf(tailorResult.tailored_latex, `${tailorResult.company}_Tailored_Resume`);
      downloadBlob(blob, `${tailorResult.company}_Tailored_Resume.pdf`);
    } catch (e: any) {
      alert("Download error: " + (e.message || e));
    }
  };

  const handleDownloadWord = async () => {
    if (!tailorResult) return;
    try {
      const blob = await compileDocx(tailorResult.tailored_latex, `${tailorResult.company}_Tailored_Resume`);
      downloadBlob(blob, `${tailorResult.company}_Tailored_Resume.docx`);
    } catch (e: any) {
      alert("Download error: " + (e.message || e));
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8 space-y-8">
        {/* Intro Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-1 text-xs font-mono text-emerald-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span>ATS Precision Engine</span>
            </div>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">
              Targeted Job Resume Tailoring
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Provide any job description or careers URL. We calculate your ATS match score, identify skill gaps honestly, and generate clean LaTeX.
            </p>
          </div>

          {tailorResult && (
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
              <Link
                href="/studio"
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 transition-all touch-manipulation"
              >
                <Code2 className="h-4 w-4 text-emerald-400" />
                <span>Open in Studio Editor</span>
              </Link>

              <button
                onClick={handleDownloadPdf}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-4 py-2.5 text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all touch-manipulation"
              >
                <Download className="h-4 w-4" />
                <span>Download PDF</span>
              </button>
            </div>
          )}
        </div>

        {/* Input Component */}
        <JobInputModal onStartTailoring={handleStartTailoring} isLoading={isLoading} />

        {/* Tailored Results Section */}
        {tailorResult && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Diff Highlights Bar */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                Tailoring Modifications Applied:
              </span>
              <ul className="mt-2 space-y-1 text-xs text-zinc-300">
                {tailorResult.diff_summary.map((d, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* ATS Score Diagnostic */}
            <AtsScoreCard
              score={tailorResult.ats_score}
              breakdown={tailorResult.ats_breakdown}
            />

            {/* Skill Gap Interactive Dialog */}
            <SkillGapDialog
              skills={tailorResult.missing_skills}
              onConfirmSkill={handleConfirmSkill}
              onDeclineSkill={handleDeclineSkill}
              isLoading={isLoading}
            />

            {/* Quick Export Cluster */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
              <div>
                <h4 className="text-sm font-semibold text-white">
                  Export Tailored Resume for {tailorResult.company}
                </h4>
                <p className="text-xs text-zinc-400">
                  Ready for submission to ATS portals with 0 em-dash formatting and Google X-Y-Z metrics.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleDownloadPdf}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-xs font-bold text-zinc-950 transition-colors shadow-sm touch-manipulation"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download .PDF</span>
                </button>

                <button
                  onClick={handleDownloadWord}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 px-4 py-2 text-xs font-medium text-zinc-200 transition-colors touch-manipulation"
                >
                  <FileType className="h-3.5 w-3.5 text-blue-400" />
                  <span>Download .DOCX</span>
                </button>

                <button
                  onClick={() => downloadText(tailorResult.tailored_latex, `${tailorResult.company}_Resume.tex`)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-400 transition-colors touch-manipulation"
                >
                  <FileText className="h-3.5 w-3.5 text-amber-400" />
                  <span>Source .TEX</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
