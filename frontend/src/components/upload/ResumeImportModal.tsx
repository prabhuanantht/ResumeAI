"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Upload, 
  FileText, 
  Sparkles, 
  Check, 
  RefreshCw, 
  X, 
  ArrowRight, 
  Cpu, 
  AlertCircle,
  FileCheck2,
  CheckCircle2
} from "lucide-react";
import { 
  uploadAndConvertResume, 
  getCuratedTemplates, 
  CuratedTemplate,
  setStoredDraft 
} from "@/lib/api";

interface ResumeImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: (latexCode: string) => void;
}

export default function ResumeImportModal({
  isOpen,
  onClose,
  onImportSuccess,
}: ResumeImportModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<"upload" | "templates">("upload");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ name: string; score: number } | null>(null);
  const [templates, setTemplates] = useState<CuratedTemplate[]>([]);

  // Load curated templates when template tab is selected
  const handleOpenTemplates = async () => {
    setActiveTab("templates");
    if (templates.length === 0) {
      try {
        const data = await getCuratedTemplates();
        setTemplates(data);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleProcessFile = async (file: File) => {
    try {
      setIsUploading(true);
      setErrorMsg(null);
      setSuccessInfo(null);

      setUploadStep("Extracting text and structure from file...");
      await new Promise((r) => setTimeout(r, 600));

      setUploadStep("AI structuring into ATS-optimized LaTeX with Google X-Y-Z formula...");
      const result = await uploadAndConvertResume(file);

      setUploadStep("Compiling PDF in sub-second Tectonic Rust engine...");
      await new Promise((r) => setTimeout(r, 400));

      setSuccessInfo({
        name: result.candidate_name,
        score: result.ats_score,
      });

      // Save to local storage for studio
      setStoredDraft(result.latex_code);

      if (onImportSuccess) {
        onImportSuccess(result.latex_code);
      }

      setTimeout(() => {
        setIsUploading(false);
        onClose();
        router.push("/studio");
      }, 1200);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to process and convert resume.");
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleSelectTemplate = (tpl: CuratedTemplate) => {
    setStoredDraft(tpl.latex_code);
    if (onImportSuccess) {
      onImportSuccess(tpl.latex_code);
    }
    onClose();
    router.push("/studio");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <Upload className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100 font-sans">
                Import Resume into ResumeAI
              </h3>
              <p className="text-xs text-zinc-400">
                Upload your existing resume or select an ATS-tested template.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Segmented Mode Tabs */}
        <div className="flex items-center rounded-xl bg-zinc-900/80 p-1 border border-zinc-800/80">
          <button
            onClick={() => setActiveTab("upload")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-1.5 text-xs font-semibold transition-all ${
              activeTab === "upload"
                ? "bg-zinc-800 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Upload Existing Resume</span>
          </button>
          <button
            onClick={handleOpenTemplates}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-1.5 text-xs font-semibold transition-all ${
              activeTab === "templates"
                ? "bg-zinc-800 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span>Choose ATS Template</span>
          </button>
        </div>

        {/* Tab 1: Upload File */}
        {activeTab === "upload" && (
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.tex,.md"
              onChange={(e) => e.target.files?.[0] && handleProcessFile(e.target.files[0])}
              className="hidden"
            />

            {!isUploading && !successInfo && (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
                  isDragOver
                    ? "border-emerald-500 bg-emerald-950/20 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                    : "border-zinc-800 hover:border-emerald-500/50 bg-zinc-900/40 hover:bg-zinc-900/70"
                }`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-3 shadow-inner">
                  <Upload className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-semibold text-zinc-100">
                  Drop your resume here, or <span className="text-emerald-400 underline">browse files</span>
                </h4>
                <p className="mt-1.5 text-xs text-zinc-400 max-w-xs">
                  Supports <strong className="text-zinc-300">PDF, DOCX, TXT, LaTeX</strong>. AI automatically converts your sections into clean, compilable LaTeX.
                </p>
                <div className="mt-4 flex items-center gap-2 text-[11px] font-mono text-zinc-500">
                  <FileText className="h-3.5 w-3.5" />
                  <span>Stored 100% locally on your machine</span>
                </div>
              </div>
            )}

            {/* In-Flight Processing Animation */}
            {isUploading && (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 text-center space-y-4">
                <div className="relative mx-auto flex h-12 w-12 items-center justify-center">
                  <RefreshCw className="h-8 w-8 text-emerald-400 animate-spin" />
                  <Sparkles className="h-4 w-4 text-emerald-300 absolute" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-100">Converting Resume to LaTeX</h4>
                  <p className="mt-1 text-xs text-emerald-400 font-mono animate-pulse">
                    {uploadStep}
                  </p>
                </div>
              </div>
            )}

            {/* Success State */}
            {successInfo && (
              <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/30 p-6 text-center space-y-3">
                <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-200">
                    Resume Successfully Converted!
                  </h4>
                  <p className="mt-1 text-xs text-zinc-300 font-mono">
                    Initial ATS Score: <span className="font-bold text-emerald-400">{successInfo.score}%</span>
                  </p>
                  <p className="mt-2 text-xs text-zinc-400">
                    Redirecting to Studio editor in Text Mode...
                  </p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs text-rose-300">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Curated Templates */}
        {activeTab === "templates" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                onClick={() => handleSelectTemplate(tpl)}
                className="group flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 hover:border-emerald-500/50 hover:bg-zinc-900 transition-all cursor-pointer shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-zinc-100 group-hover:text-emerald-400 transition-colors">
                      {tpl.name}
                    </span>
                    {tpl.badge && (
                      <span className="rounded-full bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-mono text-emerald-400">
                        {tpl.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-mono text-emerald-400/80 mb-2">
                    {tpl.role}
                  </div>
                  <p className="text-xs text-zinc-400 line-clamp-2">
                    {tpl.description}
                  </p>
                </div>

                <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-emerald-400 group-hover:translate-x-1 transition-transform">
                  <span>Load Template</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
