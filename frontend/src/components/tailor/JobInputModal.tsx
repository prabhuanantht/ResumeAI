"use client";

import React, { useState } from "react";
import { 
  Link as LinkIcon, 
  FileText, 
  Sparkles, 
  ArrowRight, 
  Building2, 
  Briefcase, 
  SlidersHorizontal,
  Loader2,
  Check
} from "lucide-react";
import { scrapeJobUrl } from "@/lib/api";

interface JobInputModalProps {
  onStartTailoring: (data: {
    job_title: string;
    company: string;
    job_description: string;
    job_url: string;
    variance_level: string;
  }) => void;
  isLoading: boolean;
}

export default function JobInputModal({ onStartTailoring, isLoading }: JobInputModalProps) {
  const [mode, setMode] = useState<"url" | "text">("url");
  const [url, setUrl] = useState("");
  const [isScraping, setIsScraping] = useState(false);

  const [jobTitle, setJobTitle] = useState("Staff Software Engineer");
  const [company, setCompany] = useState("Databricks");
  const [description, setDescription] = useState(
    `We are seeking a Staff Software Engineer to lead the architecture of our cloud-native distributed data engine.
Responsibilities:
- Architect high-throughput event streaming pipelines processing 100k+ events/sec.
- Scale Kubernetes clusters on AWS (EKS) and optimize Redis / PostgreSQL caches.
- Lead architecture design reviews and mentor senior engineers.
Requirements:
- 5+ years experience with Go, Python, or Rust.
- Deep expertise in distributed systems, gRPC, Kafka, Docker, and Kubernetes.
- Experience with GraphQL or Next.js internal portals is a plus.`
  );
  const [variance, setVariance] = useState("balanced");

  const handleScrape = async () => {
    if (!url.trim()) return;
    try {
      setIsScraping(true);
      const data = await scrapeJobUrl(url);
      setJobTitle(data.job_title);
      setCompany(data.company);
      setDescription(data.description);
      setMode("text"); // Switch to view extracted text
    } catch (e: any) {
      alert("Failed to scrape URL automatically: " + (e.message || e));
    } finally {
      setIsScraping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartTailoring({
      job_title: jobTitle,
      company: company,
      job_description: description,
      job_url: url,
      variance_level: variance,
    });
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/90 p-5 sm:p-6 shadow-2xl backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-emerald-400 uppercase tracking-wider">
              Step 1: Target Position
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white mt-0.5">
            Input Job Description or Careers Link
          </h2>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-lg border border-zinc-800 bg-zinc-900/80 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setMode("url")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-all ${
              mode === "url"
                ? "bg-zinc-800 text-white shadow"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <LinkIcon className="h-3.5 w-3.5" />
            <span>Job URL Scraper</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("text")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-all ${
              mode === "text"
                ? "bg-zinc-800 text-white shadow"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Paste JD Text</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        {mode === "url" ? (
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Paste Job Posting Link (LinkedIn, Greenhouse, Lever, Ashby, Indeed, etc.)
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://jobs.lever.co/company/job-id..."
                className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900/90 px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={handleScrape}
                disabled={isScraping || !url.trim()}
                className="flex items-center gap-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 px-4 py-2 text-xs font-semibold text-white transition-colors disabled:opacity-50"
              >
                {isScraping ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-emerald-400" />}
                <span>Fetch Details</span>
              </button>
            </div>
            <p className="mt-1.5 text-[11px] text-zinc-500 font-mono">
              Extracts title, requirements, tech stack, and key competencies automatically.
            </p>
          </div>
        ) : null}

        {/* Job Title and Company inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Job Title
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                required
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Senior Backend Engineer"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Target Company
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Stripe, OpenAI"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* JD Textarea */}
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1">
            Job Description & Requirements
          </label>
          <textarea
            required
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Paste complete job description, responsibilities, and required qualifications..."
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 p-3 text-xs text-zinc-200 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none font-mono"
          />
        </div>

        {/* Tailoring Variance Controls */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3.5">
          <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-300 mb-2">
            <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-400" />
            <span>Optimization Variance Level</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { id: "strict", label: "Conservative", desc: "100% strict adherence to existing text" },
              { id: "balanced", label: "Balanced (Recommended)", desc: "Optimized ATS keywords & Google X-Y-Z bullets" },
              { id: "growth", label: "Growth / Aggressive", desc: "Highlights high-trajectory capabilities & adjacent tech" },
            ].map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setVariance(v.id)}
                className={`rounded-lg border p-2.5 text-left transition-all ${
                  variance === v.id
                    ? "border-emerald-500/60 bg-emerald-950/20 text-white"
                    : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>{v.label}</span>
                  {variance === v.id && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                </div>
                <p className="mt-1 text-[10px] text-zinc-400 leading-tight">
                  {v.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isLoading || !description.trim()}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-6 py-2.5 text-xs font-bold text-zinc-950 shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            <span>{isLoading ? "Tailoring LaTeX Resume..." : "Generate Tailored Resume"}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
