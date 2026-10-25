"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/navigation/Navbar";
import AmbientCanvas from "@/components/3d/AmbientCanvas";
import ResumeImportModal from "@/components/upload/ResumeImportModal";
import { 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  FileText, 
  Code2, 
  Cpu, 
  Layers, 
  CheckCircle2, 
  Download, 
  Sliders,
  Check,
  Upload
} from "lucide-react";

export default function LandingPage() {
  const [importModalOpen, setImportModalOpen] = useState(false);
  return (
    <div className="relative min-h-screen bg-[#09090b] text-white overflow-hidden flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* 3D Ambient Canvas Background */}
      <AmbientCanvas />

      {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pt-16 pb-20 text-center max-w-5xl mx-auto">
        {/* Editorial Pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-3.5 py-1 text-xs font-mono text-zinc-300 backdrop-blur-md shadow-inner animate-in fade-in slide-in-from-top-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Real-Time LaTeX Engine</span>
          <span className="text-zinc-600">/</span>
          <span className="text-emerald-400">Sub-Second Rust Compiler</span>
        </div>

        {/* Main Headline */}
        <h1 className="mt-6 text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white font-sans max-w-4xl">
          Craft High-Yield LaTeX Resumes.{" "}
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
            Tailored for Every Job.
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-zinc-400 max-w-2xl font-normal leading-relaxed">
          The developer-grade resume studio with deep ATS keyword optimization and visual text editing.
          Scrapes job postings, measures ATS compatibility, enforces typography hygiene, and asks honest questions instead of hallucinating skills.
        </p>

        {/* CTA Button Cluster: Upload Resume + Studio + Tailor */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto max-w-md sm:max-w-none">
          <button
            onClick={() => setImportModalOpen(true)}
            className="group w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-6 py-3.5 text-sm font-bold text-zinc-950 shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer touch-manipulation"
          >
            <Upload className="h-4 w-4" />
            <span>Upload Existing Resume</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <Link
            href="/studio"
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/90 px-5 py-3.5 text-sm font-semibold text-zinc-200 hover:bg-zinc-800 hover:border-zinc-700 transition-all backdrop-blur-sm shadow-md touch-manipulation"
          >
            <Code2 className="h-4 w-4 text-emerald-400" />
            <span>Open Studio Editor</span>
          </Link>

          <Link
            href="/tailor"
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/60 px-5 py-3.5 text-sm font-medium text-zinc-300 hover:text-white transition-all touch-manipulation"
          >
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <span>Tailor from Job URL</span>
          </Link>
        </div>

        {/* Visual Product Showcase / Mock Split Workspace */}
        <div className="mt-14 w-full rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-2 sm:p-3 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-zinc-800/80 px-4 py-2.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
              <span className="ml-2 font-mono text-zinc-400">resumeai / resume.tex</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 text-zinc-500 font-mono text-[10px] sm:text-[11px]">
              <span className="text-emerald-400">ATS: 94%</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">Rust Compiler</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 text-left">
            {/* Editor preview mock */}
            <div className="rounded-xl border border-zinc-800/90 bg-zinc-950 p-4 font-mono text-xs text-zinc-300 space-y-2 overflow-hidden max-h-72">
              <div className="text-zinc-600">% High-yield ATS standard</div>
              <div><span className="text-indigo-400">\documentclass</span>[letterpaper,10pt]{'{article}'}</div>
              <div><span className="text-indigo-400">\usepackage</span>{'{fullpage, titlesec, enumitem}'}</div>
              <div className="text-emerald-400/90 mt-2">\begin{'{document}'}</div>
              <div className="pl-4">
                <span className="text-teal-300">\section</span>{'{Experience}'}
                <div className="pl-4 text-zinc-400">
                  \resumeItem{'{Architected high-throughput event streaming engine in Go and Python, handling 45,000+ events/sec with sub-15ms p99 latency.}'}
                </div>
              </div>
              <div className="text-emerald-400/90">\end{'{document}'}</div>
            </div>

            {/* Rendered Preview Mock */}
            <div className="rounded-xl border border-zinc-800/90 bg-white p-5 text-zinc-900 space-y-3 font-serif max-h-72 overflow-hidden shadow-inner">
              <div className="text-center border-b border-zinc-200 pb-2">
                <div className="text-lg font-bold tracking-tight text-zinc-950">ALEX MERCER</div>
                <div className="text-[10px] text-zinc-600 font-sans mt-0.5">
                  San Francisco, CA • alex.mercer@gmail.com • github.com/alexmercer
                </div>
              </div>
              <div>
                <div className="text-[11px] font-bold tracking-wide uppercase border-b border-zinc-300 text-zinc-900 pb-0.5 font-sans">
                  EXPERIENCE
                </div>
                <div className="mt-1.5 text-[10px] leading-relaxed">
                  <div className="flex justify-between font-bold font-sans">
                    <span>Senior Full Stack Engineer — CloudScale Systems</span>
                    <span className="font-normal text-zinc-600">June 2023 -- Present</span>
                  </div>
                  <ul className="list-disc pl-4 mt-1 space-y-0.5 text-zinc-800 font-sans text-[9.5px]">
                    <li>Architected event streaming engine in Go and Python, processing 45,000+ events/sec with sub-15ms latency.</li>
                    <li>Designed responsive Next.js analytics dashboard, reducing page load time by 42%.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-5 text-left w-full">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 backdrop-blur space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-white">
              Strict ATS & TeX Hygiene
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Standardizes all date spans with LaTeX en dashes (&ldquo;--&rdquo;) and eliminates unescaped tokens that break ATS parsers and compilation engines.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 backdrop-blur space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-white">
              Honest Skill Alignment Dialog
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              When a job description requires technologies not in your background, the system asks you first before adding them, or generates a personalized learning roadmap.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 backdrop-blur space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Sliders className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-white">
              User-Editable System Prompts
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Tweak Gemini&apos;s system prompt, enforce negative constraints, ban AI buzzwords (&ldquo;spearheaded&rdquo;, &ldquo;synergized&rdquo;), and select your model.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-900 bg-zinc-950/80 py-6 text-center text-xs text-zinc-500 font-mono">
        ResumeAI • Intelligent LaTeX Resume Builder &amp; ATS Optimizer
      </footer>

      {/* Global Resume Import & Template Selection Modal */}
      <ResumeImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
      />
    </div>
  );
}
