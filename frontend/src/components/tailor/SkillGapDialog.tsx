"use client";

import React, { useState } from "react";
import { 
  Sparkles, 
  CheckCircle2, 
  BookOpen, 
  GraduationCap, 
  HelpCircle, 
  ArrowRight, 
  ChevronRight,
  ShieldAlert,
  Clock,
  Check
} from "lucide-react";
import { SkillGapItem } from "@/lib/api";

interface SkillGapDialogProps {
  skills: SkillGapItem[];
  onConfirmSkill: (skill: string, userNote?: string) => void;
  onDeclineSkill: (skill: string) => void;
  isLoading?: boolean;
}

export default function SkillGapDialog({
  skills,
  onConfirmSkill,
  onDeclineSkill,
  isLoading = false,
}: SkillGapDialogProps) {
  const [activeNotes, setActiveNotes] = useState<Record<string, string>>({});
  const [showRoadmap, setShowRoadmap] = useState<Record<string, boolean>>({});

  if (!skills || skills.length === 0) return null;

  const pendingSkills = skills.filter((s) => s.status === "pending");

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-950/10 p-5 shadow-2xl backdrop-blur-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-500/20 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
            <GraduationCap className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">
              Skill Alignment & Honest Representation
            </h4>
            <p className="text-xs text-amber-200/80">
              The target role asks for skills not in your base profile. Would you like to confirm experience or generate a learning roadmap?
            </p>
          </div>
        </div>
        <div className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-mono font-medium text-amber-300">
          {pendingSkills.length} pending
        </div>
      </div>

      {/* Skills Decision Cards */}
      <div className="space-y-3">
        {skills.map((item, idx) => {
          const isPending = item.status === "pending";
          const isConfirmed = item.status === "confirmed_add";
          const isDeclined = item.status === "declined";
          const roadmapOpen = showRoadmap[item.skill];

          return (
            <div
              key={idx}
              className={`rounded-xl border transition-all p-4 ${
                isConfirmed
                  ? "border-emerald-500/40 bg-emerald-950/20"
                  : isDeclined
                  ? "border-zinc-800 bg-zinc-900/40 opacity-70"
                  : "border-amber-500/30 bg-zinc-950/80 hover:border-amber-500/50"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-zinc-100">
                      {item.skill}
                    </span>
                    <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-mono uppercase text-amber-300">
                      {item.importance}
                    </span>
                    {isConfirmed && (
                      <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                        <Check className="h-3 w-3" /> Confirmed for Resume
                      </span>
                    )}
                    {isDeclined && (
                      <span className="text-[11px] font-mono text-zinc-500">
                        Excluded (Learning Roadmap Active)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {item.prompt_question}
                  </p>
                </div>

                {/* Decision Actions if Pending */}
                {isPending && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                    <button
                      onClick={() => onConfirmSkill(item.skill, activeNotes[item.skill])}
                      disabled={isLoading}
                      className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-3 py-1.5 text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>I know this (Add)</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowRoadmap((prev) => ({ ...prev, [item.skill]: !prev[item.skill] }));
                        onDeclineSkill(item.skill);
                      }}
                      disabled={isLoading}
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition-all disabled:opacity-50"
                    >
                      <BookOpen className="h-3.5 w-3.5 text-amber-400" />
                      <span>Learn It (Roadmap)</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Optional user note input when confirming */}
              {isPending && (
                <div className="mt-3">
                  <input
                    type="text"
                    value={activeNotes[item.skill] || ""}
                    onChange={(e) => setActiveNotes({ ...activeNotes, [item.skill]: e.target.value })}
                    placeholder="Optional: Mention your context (e.g. 'Used at prior company for 8 months')..."
                    className="w-full rounded-md border border-zinc-800 bg-zinc-900/90 px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              )}

              {/* Learning Roadmap Dropdown */}
              {(roadmapOpen || isDeclined) && item.learning_roadmap && (
                <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-950/20 p-3 text-xs text-amber-200/90">
                  <div className="flex items-center gap-1.5 font-semibold text-amber-300 mb-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Fast-Track Learning Path for {item.skill}:</span>
                  </div>
                  <pre className="whitespace-pre-line font-mono text-[11px] text-zinc-300">
                    {item.learning_roadmap}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
