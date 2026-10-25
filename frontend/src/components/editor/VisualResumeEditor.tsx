"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  ResumeModel, 
  parseLatexToModel, 
  serializeModelToLatex,
  ExperienceItem,
  ProjectItem,
  EducationItem
} from "@/lib/latex-parser";
import { 
  User, 
  Briefcase, 
  FolderGit2, 
  GraduationCap, 
  Wrench, 
  Plus, 
  Trash2, 
  Sparkles,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface VisualResumeEditorProps {
  latexCode: string;
  onChange: (newLatex: string) => void;
  onCompile?: () => void;
}

export default function VisualResumeEditor({
  latexCode,
  onChange,
  onCompile,
}: VisualResumeEditorProps) {
  const [model, setModel] = useState<ResumeModel>(() => parseLatexToModel(latexCode));
  const isInternalChangeRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync external LaTeX changes (e.g. from AI Copilot or switching from Code mode)
  useEffect(() => {
    if (isInternalChangeRef.current) {
      isInternalChangeRef.current = false;
      return;
    }
    const parsed = parseLatexToModel(latexCode);
    setModel(parsed);
  }, [latexCode]);

  // Debounced notification of changes to parent
  const notifyChange = (updated: ResumeModel) => {
    setModel(updated);
    isInternalChangeRef.current = true;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const generated = serializeModelToLatex(updated);
      onChange(generated);
    }, 350);
  };

  // --- Handlers for Contact Info ---
  const handleContactChange = (field: keyof ResumeModel, value: string) => {
    const updated = { ...model, [field]: value };
    notifyChange(updated);
  };

  // --- Handlers for Experience ---
  const handleAddExperience = () => {
    const newItem: ExperienceItem = {
      id: `exp-${Date.now()}`,
      role: "Software Engineer",
      company: "Company Name",
      location: "San Francisco, CA",
      dates: "2023 -- Present",
      bullets: ["Engineered scalable backend microservices and APIs."],
    };
    notifyChange({ ...model, experience: [newItem, ...model.experience] });
  };

  const handleUpdateExperience = (idx: number, field: keyof ExperienceItem, value: any) => {
    const list = [...model.experience];
    list[idx] = { ...list[idx], [field]: value };
    notifyChange({ ...model, experience: list });
  };

  const handleRemoveExperience = (idx: number) => {
    const list = model.experience.filter((_, i) => i !== idx);
    notifyChange({ ...model, experience: list });
  };

  const handleAddExpBullet = (expIdx: number) => {
    const list = [...model.experience];
    list[expIdx].bullets = [...list[expIdx].bullets, ""];
    notifyChange({ ...model, experience: list });
  };

  const handleUpdateExpBullet = (expIdx: number, bulletIdx: number, text: string) => {
    const list = [...model.experience];
    const bullets = [...list[expIdx].bullets];
    bullets[bulletIdx] = text;
    list[expIdx].bullets = bullets;
    notifyChange({ ...model, experience: list });
  };

  const handleRemoveExpBullet = (expIdx: number, bulletIdx: number) => {
    const list = [...model.experience];
    list[expIdx].bullets = list[expIdx].bullets.filter((_, i) => i !== bulletIdx);
    notifyChange({ ...model, experience: list });
  };

  // --- Handlers for Projects ---
  const handleAddProject = () => {
    const newItem: ProjectItem = {
      id: `proj-${Date.now()}`,
      name: "New Project",
      tech: "TypeScript, React, Node.js",
      dates: "2024",
      description: "Full Stack Application",
      link: "https://github.com/username/project",
      bullets: ["Architected and deployed responsive cloud application."],
    };
    notifyChange({ ...model, projects: [newItem, ...model.projects] });
  };

  const handleUpdateProject = (idx: number, field: keyof ProjectItem, value: any) => {
    const list = [...model.projects];
    list[idx] = { ...list[idx], [field]: value };
    notifyChange({ ...model, projects: list });
  };

  const handleRemoveProject = (idx: number) => {
    const list = model.projects.filter((_, i) => i !== idx);
    notifyChange({ ...model, projects: list });
  };

  const handleAddProjBullet = (projIdx: number) => {
    const list = [...model.projects];
    list[projIdx].bullets = [...list[projIdx].bullets, ""];
    notifyChange({ ...model, projects: list });
  };

  const handleUpdateProjBullet = (projIdx: number, bulletIdx: number, text: string) => {
    const list = [...model.projects];
    const bullets = [...list[projIdx].bullets];
    bullets[bulletIdx] = text;
    list[projIdx].bullets = bullets;
    notifyChange({ ...model, projects: list });
  };

  const handleRemoveProjBullet = (projIdx: number, bulletIdx: number) => {
    const list = [...model.projects];
    list[projIdx].bullets = list[projIdx].bullets.filter((_, i) => i !== bulletIdx);
    notifyChange({ ...model, projects: list });
  };

  // --- Handlers for Education ---
  const handleAddEducation = () => {
    const newItem: EducationItem = {
      id: `edu-${Date.now()}`,
      institution: "University Name",
      location: "City, State",
      degree: "Bachelor of Science in Computer Science",
      dates: "2019 -- 2023",
    };
    notifyChange({ ...model, education: [...model.education, newItem] });
  };

  const handleUpdateEducation = (idx: number, field: keyof EducationItem, value: string) => {
    const list = [...model.education];
    list[idx] = { ...list[idx], [field]: value };
    notifyChange({ ...model, education: list });
  };

  const handleRemoveEducation = (idx: number) => {
    const list = model.education.filter((_, i) => i !== idx);
    notifyChange({ ...model, education: list });
  };

  // --- Handlers for Skills ---
  const handleSkillsChange = (field: keyof ResumeModel["skills"], value: string) => {
    const updated = {
      ...model,
      skills: {
        ...model.skills,
        [field]: value,
      },
    };
    notifyChange(updated);
  };

  return (
    <div className="h-full overflow-y-auto px-4 py-5 space-y-6 text-zinc-200">
      {/* 1. Header & Contact Details */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-2.5">
          <User className="h-4 w-4 text-emerald-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
            Personal Information
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-mono text-zinc-400 mb-1">Full Name</label>
            <input
              type="text"
              value={model.name}
              onChange={(e) => handleContactChange("name", e.target.value)}
              placeholder="e.g. Alex Mercer"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-sm font-semibold text-zinc-100 focus:border-emerald-500/60 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-zinc-400 mb-1">Email</label>
            <input
              type="email"
              value={model.email}
              onChange={(e) => handleContactChange("email", e.target.value)}
              placeholder="alex@example.com"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-200 focus:border-emerald-500/60 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-zinc-400 mb-1">Phone</label>
            <input
              type="text"
              value={model.phone}
              onChange={(e) => handleContactChange("phone", e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-200 focus:border-emerald-500/60 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-zinc-400 mb-1">LinkedIn</label>
            <input
              type="text"
              value={model.linkedin}
              onChange={(e) => handleContactChange("linkedin", e.target.value)}
              placeholder="linkedin.com/in/username"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-200 focus:border-emerald-500/60 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-zinc-400 mb-1">GitHub</label>
            <input
              type="text"
              value={model.github}
              onChange={(e) => handleContactChange("github", e.target.value)}
              placeholder="github.com/username"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-200 focus:border-emerald-500/60 focus:outline-none transition-colors"
            />
          </div>
        </div>
      </section>

      {/* 2. Professional Experience */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Work Experience
            </h3>
          </div>
          <button
            onClick={handleAddExperience}
            className="flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-800/80 px-2 py-1 text-[11px] font-medium text-emerald-400 hover:border-emerald-500/50 hover:bg-zinc-800 transition-colors"
          >
            <Plus className="h-3 w-3" />
            <span>Add Position</span>
          </button>
        </div>

        <div className="space-y-4">
          {model.experience.map((exp, expIdx) => (
            <div
              key={exp.id || expIdx}
              className="rounded-lg border border-zinc-800/90 bg-zinc-950/70 p-3.5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider">
                  Role #{expIdx + 1}
                </span>
                <button
                  onClick={() => handleRemoveExperience(expIdx)}
                  className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-rose-400 transition-colors"
                  title="Delete experience"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 mb-0.5">Role Title</label>
                  <input
                    type="text"
                    value={exp.role}
                    onChange={(e) => handleUpdateExperience(expIdx, "role", e.target.value)}
                    placeholder="Senior Software Engineer"
                    className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-100 focus:border-emerald-500/60 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 mb-0.5">Company</label>
                  <input
                    type="text"
                    value={exp.company}
                    onChange={(e) => handleUpdateExperience(expIdx, "company", e.target.value)}
                    placeholder="Company Name"
                    className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-100 focus:border-emerald-500/60 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 mb-0.5">Location</label>
                  <input
                    type="text"
                    value={exp.location}
                    onChange={(e) => handleUpdateExperience(expIdx, "location", e.target.value)}
                    placeholder="San Francisco, CA"
                    className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-200 focus:border-emerald-500/60 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 mb-0.5">Dates</label>
                  <input
                    type="text"
                    value={exp.dates}
                    onChange={(e) => handleUpdateExperience(expIdx, "dates", e.target.value)}
                    placeholder="June 2023 -- Present"
                    className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-200 focus:border-emerald-500/60 focus:outline-none"
                  />
                </div>
              </div>

              {/* Bullet Points */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-[10px] font-mono text-zinc-400">
                  Bullet Points (Achievements & Metrics)
                </label>
                {exp.bullets.map((bullet, bIdx) => (
                  <div key={bIdx} className="flex items-start gap-1.5 group">
                    <span className="text-emerald-400 font-bold select-none pt-1 text-xs">•</span>
                    <textarea
                      rows={2}
                      value={bullet}
                      onChange={(e) => handleUpdateExpBullet(expIdx, bIdx, e.target.value)}
                      placeholder="Action verb + metric + technical outcome (e.g., Architected Go streaming engine, handling 45k req/s)..."
                      className="flex-1 rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-200 focus:border-emerald-500/60 focus:outline-none resize-y leading-relaxed"
                    />
                    <button
                      onClick={() => handleRemoveExpBullet(expIdx, bIdx)}
                      className="opacity-0 group-hover:opacity-100 rounded p-1 text-zinc-500 hover:text-rose-400 transition-opacity mt-1"
                      title="Remove bullet"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}

                <button
                  onClick={() => handleAddExpBullet(expIdx)}
                  className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 hover:text-emerald-300 pt-1"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add Bullet Point</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Projects */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
          <div className="flex items-center gap-2">
            <FolderGit2 className="h-4 w-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Projects
            </h3>
          </div>
          <button
            onClick={handleAddProject}
            className="flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-800/80 px-2 py-1 text-[11px] font-medium text-emerald-400 hover:border-emerald-500/50 hover:bg-zinc-800 transition-colors"
          >
            <Plus className="h-3 w-3" />
            <span>Add Project</span>
          </button>
        </div>

        <div className="space-y-4">
          {model.projects.map((proj, projIdx) => (
            <div
              key={proj.id || projIdx}
              className="rounded-lg border border-zinc-800/90 bg-zinc-950/70 p-3.5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider">
                  Project #{projIdx + 1}
                </span>
                <button
                  onClick={() => handleRemoveProject(projIdx)}
                  className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-rose-400 transition-colors"
                  title="Delete project"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 mb-0.5">Project Name</label>
                  <input
                    type="text"
                    value={proj.name}
                    onChange={(e) => handleUpdateProject(projIdx, "name", e.target.value)}
                    placeholder="VectorSearch Engine"
                    className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-100 focus:border-emerald-500/60 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 mb-0.5">Tech Stack</label>
                  <input
                    type="text"
                    value={proj.tech}
                    onChange={(e) => handleUpdateProject(projIdx, "tech", e.target.value)}
                    placeholder="Python, PyTorch, Docker, FastAPI"
                    className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-100 focus:border-emerald-500/60 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 mb-0.5">Date</label>
                  <input
                    type="text"
                    value={proj.dates}
                    onChange={(e) => handleUpdateProject(projIdx, "dates", e.target.value)}
                    placeholder="June 2023"
                    className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-200 focus:border-emerald-500/60 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 mb-0.5">Link / URL</label>
                  <input
                    type="text"
                    value={proj.link}
                    onChange={(e) => handleUpdateProject(projIdx, "link", e.target.value)}
                    placeholder="https://github.com/..."
                    className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-200 focus:border-emerald-500/60 focus:outline-none"
                  />
                </div>
              </div>

              {/* Bullet Points */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-[10px] font-mono text-zinc-400">
                  Project Highlights & Impact
                </label>
                {proj.bullets.map((bullet, bIdx) => (
                  <div key={bIdx} className="flex items-start gap-1.5 group">
                    <span className="text-emerald-400 font-bold select-none pt-1 text-xs">•</span>
                    <textarea
                      rows={2}
                      value={bullet}
                      onChange={(e) => handleUpdateProjBullet(projIdx, bIdx, e.target.value)}
                      placeholder="Key achievement or engineering challenge solved..."
                      className="flex-1 rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-200 focus:border-emerald-500/60 focus:outline-none resize-y leading-relaxed"
                    />
                    <button
                      onClick={() => handleRemoveProjBullet(projIdx, bIdx)}
                      className="opacity-0 group-hover:opacity-100 rounded p-1 text-zinc-500 hover:text-rose-400 transition-opacity mt-1"
                      title="Remove bullet"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}

                <button
                  onClick={() => handleAddProjBullet(projIdx)}
                  className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 hover:text-emerald-300 pt-1"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add Bullet Point</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Education */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Education
            </h3>
          </div>
          <button
            onClick={handleAddEducation}
            className="flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-800/80 px-2 py-1 text-[11px] font-medium text-emerald-400 hover:border-emerald-500/50 hover:bg-zinc-800 transition-colors"
          >
            <Plus className="h-3 w-3" />
            <span>Add Education</span>
          </button>
        </div>

        <div className="space-y-3">
          {model.education.map((edu, eduIdx) => (
            <div
              key={edu.id || eduIdx}
              className="rounded-lg border border-zinc-800/90 bg-zinc-950/70 p-3 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider">
                  School #{eduIdx + 1}
                </span>
                <button
                  onClick={() => handleRemoveEducation(eduIdx)}
                  className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-rose-400 transition-colors"
                  title="Delete education"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 mb-0.5">Institution</label>
                  <input
                    type="text"
                    value={edu.institution}
                    onChange={(e) => handleUpdateEducation(eduIdx, "institution", e.target.value)}
                    placeholder="University of California, Berkeley"
                    className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-100 focus:border-emerald-500/60 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 mb-0.5">Location</label>
                  <input
                    type="text"
                    value={edu.location}
                    onChange={(e) => handleUpdateEducation(eduIdx, "location", e.target.value)}
                    placeholder="Berkeley, CA"
                    className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-200 focus:border-emerald-500/60 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 mb-0.5">Degree & GPA</label>
                  <input
                    type="text"
                    value={edu.degree}
                    onChange={(e) => handleUpdateEducation(eduIdx, "degree", e.target.value)}
                    placeholder="B.S. Computer Science, GPA: 3.86"
                    className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-200 focus:border-emerald-500/60 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 mb-0.5">Graduation Date</label>
                  <input
                    type="text"
                    value={edu.dates}
                    onChange={(e) => handleUpdateEducation(eduIdx, "dates", e.target.value)}
                    placeholder="Aug 2018 -- May 2022"
                    className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-200 focus:border-emerald-500/60 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Technical Skills */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3 shadow-sm">
        <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-2.5">
          <Wrench className="h-4 w-4 text-emerald-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
            Technical Skills
          </h3>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-mono text-zinc-400 mb-0.5">Languages</label>
            <input
              type="text"
              value={model.skills.languages}
              onChange={(e) => handleSkillsChange("languages", e.target.value)}
              placeholder="Python, TypeScript, JavaScript, Go, SQL, C++, HTML/CSS"
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-200 focus:border-emerald-500/60 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono text-zinc-400 mb-0.5">Frameworks & Libraries</label>
            <input
              type="text"
              value={model.skills.frameworks}
              onChange={(e) => handleSkillsChange("frameworks", e.target.value)}
              placeholder="Next.js, React, FastAPI, Node.js, Express, TailwindCSS, PyTorch"
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-200 focus:border-emerald-500/60 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono text-zinc-400 mb-0.5">Cloud & DevOps</label>
            <input
              type="text"
              value={model.skills.cloud}
              onChange={(e) => handleSkillsChange("cloud", e.target.value)}
              placeholder="AWS (EKS, S3, Aurora), Docker, Kubernetes, CI/CD, Redis, PostgreSQL"
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-200 focus:border-emerald-500/60 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono text-zinc-400 mb-0.5">Developer Tools</label>
            <input
              type="text"
              value={model.skills.tools}
              onChange={(e) => handleSkillsChange("tools", e.target.value)}
              placeholder="Linux, Postman, Vim, Grafana, Prometheus, Datadog, Git"
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-200 focus:border-emerald-500/60 focus:outline-none"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
