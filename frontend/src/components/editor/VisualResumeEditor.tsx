"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  ResumeModel, 
  parseLatexToModel, 
  serializeModelToLatex,
  DynamicSection,
  SubheadingItem,
  KeyValueCategory,
  SectionType
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
  FileText,
  Award,
  List,
  Type,
  MoreVertical
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
  const [showAddSectionMenu, setShowAddSectionMenu] = useState(false);
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

  // --- Handlers for Dynamic Sections ---
  const handleRemoveSection = (secIdx: number) => {
    const updatedSections = model.sections.filter((_, i) => i !== secIdx);
    notifyChange({ ...model, sections: updatedSections });
  };

  const handleUpdateSectionTitle = (secIdx: number, newTitle: string) => {
    const updatedSections = [...model.sections];
    updatedSections[secIdx] = { ...updatedSections[secIdx], title: newTitle };
    notifyChange({ ...model, sections: updatedSections });
  };

  const handleAddNewSection = (title: string, type: SectionType) => {
    const newSection: DynamicSection = {
      id: `sec-${Date.now()}`,
      title,
      type,
      items: type === "subheadings" ? [
        {
          id: `item-${Date.now()}`,
          primaryTitle: "Title / Role",
          secondaryTitle: "Organization / Tech",
          location: "Location",
          dates: "2024 -- Present",
          bullets: ["Key accomplishment or achievement..."],
        }
      ] : undefined,
      categories: type === "key_value" ? [
        { id: `cat-${Date.now()}`, label: "Category", value: "Item 1, Item 2, Item 3" }
      ] : undefined,
      bullets: type === "bullet_list" ? ["New bullet item or certification..."] : undefined,
      content: type === "paragraph" ? "Write section summary or details here..." : undefined,
    };

    notifyChange({ ...model, sections: [...model.sections, newSection] });
    setShowAddSectionMenu(false);
  };

  // --- Handlers for Subheadings (Experience, Projects, Education) ---
  const handleAddSubheadingItem = (secIdx: number) => {
    const updatedSections = [...model.sections];
    const sec = updatedSections[secIdx];
    const newItem: SubheadingItem = {
      id: `item-${Date.now()}`,
      primaryTitle: "New Position / Item",
      secondaryTitle: "Company / Organization",
      location: "City, State",
      dates: "2024 -- Present",
      bullets: ["Action verb + metric + outcome..."],
    };
    sec.items = [...(sec.items || []), newItem];
    notifyChange({ ...model, sections: updatedSections });
  };

  const handleUpdateSubheadingField = (secIdx: number, itemIdx: number, field: keyof SubheadingItem, value: any) => {
    const updatedSections = [...model.sections];
    const sec = updatedSections[secIdx];
    if (!sec.items) return;
    sec.items[itemIdx] = { ...sec.items[itemIdx], [field]: value };
    notifyChange({ ...model, sections: updatedSections });
  };

  const handleRemoveSubheadingItem = (secIdx: number, itemIdx: number) => {
    const updatedSections = [...model.sections];
    const sec = updatedSections[secIdx];
    if (!sec.items) return;
    sec.items = sec.items.filter((_, i) => i !== itemIdx);
    notifyChange({ ...model, sections: updatedSections });
  };

  const handleAddSubheadingBullet = (secIdx: number, itemIdx: number) => {
    const updatedSections = [...model.sections];
    const sec = updatedSections[secIdx];
    if (!sec.items) return;
    sec.items[itemIdx].bullets = [...sec.items[itemIdx].bullets, ""];
    notifyChange({ ...model, sections: updatedSections });
  };

  const handleUpdateSubheadingBullet = (secIdx: number, itemIdx: number, bulletIdx: number, text: string) => {
    const updatedSections = [...model.sections];
    const sec = updatedSections[secIdx];
    if (!sec.items) return;
    const bullets = [...sec.items[itemIdx].bullets];
    bullets[bulletIdx] = text;
    sec.items[itemIdx].bullets = bullets;
    notifyChange({ ...model, sections: updatedSections });
  };

  const handleRemoveSubheadingBullet = (secIdx: number, itemIdx: number, bulletIdx: number) => {
    const updatedSections = [...model.sections];
    const sec = updatedSections[secIdx];
    if (!sec.items) return;
    sec.items[itemIdx].bullets = sec.items[itemIdx].bullets.filter((_, i) => i !== bulletIdx);
    notifyChange({ ...model, sections: updatedSections });
  };

  // --- Handlers for Key-Value Categories (Skills) ---
  const handleAddCategory = (secIdx: number) => {
    const updatedSections = [...model.sections];
    const sec = updatedSections[secIdx];
    const newCat: KeyValueCategory = {
      id: `cat-${Date.now()}`,
      label: "New Category",
      value: "Item A, Item B, Item C",
    };
    sec.categories = [...(sec.categories || []), newCat];
    notifyChange({ ...model, sections: updatedSections });
  };

  const handleUpdateCategory = (secIdx: number, catIdx: number, field: "label" | "value", value: string) => {
    const updatedSections = [...model.sections];
    const sec = updatedSections[secIdx];
    if (!sec.categories) return;
    sec.categories[catIdx] = { ...sec.categories[catIdx], [field]: value };
    notifyChange({ ...model, sections: updatedSections });
  };

  const handleRemoveCategory = (secIdx: number, catIdx: number) => {
    const updatedSections = [...model.sections];
    const sec = updatedSections[secIdx];
    if (!sec.categories) return;
    sec.categories = sec.categories.filter((_, i) => i !== catIdx);
    notifyChange({ ...model, sections: updatedSections });
  };

  // --- Handlers for Bullet Lists (Certifications, Awards) ---
  const handleAddSimpleBullet = (secIdx: number) => {
    const updatedSections = [...model.sections];
    const sec = updatedSections[secIdx];
    sec.bullets = [...(sec.bullets || []), ""];
    notifyChange({ ...model, sections: updatedSections });
  };

  const handleUpdateSimpleBullet = (secIdx: number, bIdx: number, text: string) => {
    const updatedSections = [...model.sections];
    const sec = updatedSections[secIdx];
    if (!sec.bullets) return;
    sec.bullets[bIdx] = text;
    notifyChange({ ...model, sections: updatedSections });
  };

  const handleRemoveSimpleBullet = (secIdx: number, bIdx: number) => {
    const updatedSections = [...model.sections];
    const sec = updatedSections[secIdx];
    if (!sec.bullets) return;
    sec.bullets = sec.bullets.filter((_, i) => i !== bIdx);
    notifyChange({ ...model, sections: updatedSections });
  };

  // --- Handlers for Paragraphs (Summary) ---
  const handleUpdateParagraphContent = (secIdx: number, text: string) => {
    const updatedSections = [...model.sections];
    updatedSections[secIdx].content = text;
    notifyChange({ ...model, sections: updatedSections });
  };

  const getSectionIcon = (title: string, type: SectionType) => {
    const lower = title.toLowerCase();
    if (lower.includes("exp") || lower.includes("work") || lower.includes("employ")) return <Briefcase className="h-4 w-4 text-emerald-400" />;
    if (lower.includes("proj")) return <FolderGit2 className="h-4 w-4 text-emerald-400" />;
    if (lower.includes("edu")) return <GraduationCap className="h-4 w-4 text-emerald-400" />;
    if (lower.includes("skill")) return <Wrench className="h-4 w-4 text-emerald-400" />;
    if (lower.includes("cert") || lower.includes("licens") || lower.includes("award") || lower.includes("honor")) return <Award className="h-4 w-4 text-emerald-400" />;
    if (lower.includes("summary") || lower.includes("bio") || lower.includes("about")) return <FileText className="h-4 w-4 text-emerald-400" />;
    if (type === "bullet_list") return <List className="h-4 w-4 text-emerald-400" />;
    return <Type className="h-4 w-4 text-emerald-400" />;
  };

  return (
    <div className="h-full overflow-y-auto px-4 py-5 space-y-6 text-zinc-200">
      {/* 1. Header & Contact Information */}
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

      {/* 2. Dynamic Sections (Experience, Projects, Education, Skills, Certifications, etc.) */}
      {model.sections.map((sec, secIdx) => (
        <section
          key={sec.id || secIdx}
          className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-4 shadow-sm"
        >
          {/* Section Header */}
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              {getSectionIcon(sec.title, sec.type)}
              <input
                type="text"
                value={sec.title}
                onChange={(e) => handleUpdateSectionTitle(secIdx, e.target.value)}
                className="bg-transparent font-bold text-xs uppercase tracking-wider text-zinc-200 hover:text-white focus:outline-none focus:border-b focus:border-emerald-400"
              />
              <span className="text-[10px] font-mono text-zinc-500 bg-zinc-800/60 px-1.5 py-0.5 rounded">
                {sec.type}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {sec.type === "subheadings" && (
                <button
                  onClick={() => handleAddSubheadingItem(secIdx)}
                  className="flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-800/80 px-2 py-1 text-[11px] font-medium text-emerald-400 hover:bg-zinc-800 transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add Item</span>
                </button>
              )}

              {sec.type === "key_value" && (
                <button
                  onClick={() => handleAddCategory(secIdx)}
                  className="flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-800/80 px-2 py-1 text-[11px] font-medium text-emerald-400 hover:bg-zinc-800 transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add Group</span>
                </button>
              )}

              {sec.type === "bullet_list" && (
                <button
                  onClick={() => handleAddSimpleBullet(secIdx)}
                  className="flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-800/80 px-2 py-1 text-[11px] font-medium text-emerald-400 hover:bg-zinc-800 transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add Bullet</span>
                </button>
              )}

              <button
                onClick={() => handleRemoveSection(secIdx)}
                className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-rose-400 transition-colors"
                title="Delete section"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Section Body: Subheadings Type (Experience / Projects / Education) */}
          {sec.type === "subheadings" && sec.items && (
            <div className="space-y-4">
              {sec.items.map((item, itemIdx) => (
                <div
                  key={item.id || itemIdx}
                  className="rounded-lg border border-zinc-800/90 bg-zinc-950/70 p-3.5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider">
                      Item #{itemIdx + 1}
                    </span>
                    <button
                      onClick={() => handleRemoveSubheadingItem(secIdx, itemIdx)}
                      className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-rose-400 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-400 mb-0.5">Title / Role</label>
                      <input
                        type="text"
                        value={item.primaryTitle}
                        onChange={(e) => handleUpdateSubheadingField(secIdx, itemIdx, "primaryTitle", e.target.value)}
                        placeholder="e.g. Senior Software Engineer"
                        className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-100 focus:border-emerald-500/60 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-zinc-400 mb-0.5">Company / Tech</label>
                      <input
                        type="text"
                        value={item.secondaryTitle || ""}
                        onChange={(e) => handleUpdateSubheadingField(secIdx, itemIdx, "secondaryTitle", e.target.value)}
                        placeholder="e.g. Google Cloud"
                        className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-100 focus:border-emerald-500/60 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-zinc-400 mb-0.5">Location</label>
                      <input
                        type="text"
                        value={item.location || ""}
                        onChange={(e) => handleUpdateSubheadingField(secIdx, itemIdx, "location", e.target.value)}
                        placeholder="San Francisco, CA"
                        className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-200 focus:border-emerald-500/60 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-zinc-400 mb-0.5">Dates / Link</label>
                      <input
                        type="text"
                        value={item.dates || ""}
                        onChange={(e) => handleUpdateSubheadingField(secIdx, itemIdx, "dates", e.target.value)}
                        placeholder="June 2023 -- Present"
                        className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-200 focus:border-emerald-500/60 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Bullet Points */}
                  <div className="space-y-1.5 pt-1">
                    <label className="block text-[10px] font-mono text-zinc-400">
                      Bullet Points (Metrics & Outcomes)
                    </label>
                    {item.bullets.map((bullet, bIdx) => (
                      <div key={bIdx} className="flex items-start gap-1.5 group">
                        <span className="text-emerald-400 font-bold select-none pt-1 text-xs">•</span>
                        <textarea
                          rows={2}
                          value={bullet}
                          onChange={(e) => handleUpdateSubheadingBullet(secIdx, itemIdx, bIdx, e.target.value)}
                          placeholder="Action verb + metric + outcome..."
                          className="flex-1 rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-200 focus:border-emerald-500/60 focus:outline-none resize-y leading-relaxed"
                        />
                        <button
                          onClick={() => handleRemoveSubheadingBullet(secIdx, itemIdx, bIdx)}
                          className="opacity-0 group-hover:opacity-100 rounded p-1 text-zinc-500 hover:text-rose-400 transition-opacity mt-1"
                          title="Remove bullet"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}

                    <button
                      onClick={() => handleAddSubheadingBullet(secIdx, itemIdx)}
                      className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 hover:text-emerald-300 pt-1"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Add Bullet Point</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Section Body: Key-Value Type (Skills) */}
          {sec.type === "key_value" && sec.categories && (
            <div className="space-y-3">
              {sec.categories.map((cat, catIdx) => (
                <div key={cat.id || catIdx} className="flex items-center gap-2 group">
                  <input
                    type="text"
                    value={cat.label}
                    onChange={(e) => handleUpdateCategory(secIdx, catIdx, "label", e.target.value)}
                    placeholder="Category Name"
                    className="w-1/3 rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs font-semibold text-zinc-200 focus:border-emerald-500/60 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={cat.value}
                    onChange={(e) => handleUpdateCategory(secIdx, catIdx, "value", e.target.value)}
                    placeholder="Comma-separated items..."
                    className="flex-1 rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-300 focus:border-emerald-500/60 focus:outline-none"
                  />
                  <button
                    onClick={() => handleRemoveCategory(secIdx, catIdx)}
                    className="opacity-0 group-hover:opacity-100 rounded p-1 text-zinc-500 hover:text-rose-400 transition-opacity"
                    title="Remove group"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Section Body: Simple Bulleted List (Certifications, Awards) */}
          {sec.type === "bullet_list" && sec.bullets && (
            <div className="space-y-2">
              {sec.bullets.map((b, bIdx) => (
                <div key={bIdx} className="flex items-center gap-2 group">
                  <span className="text-emerald-400 font-bold select-none">•</span>
                  <input
                    type="text"
                    value={b}
                    onChange={(e) => handleUpdateSimpleBullet(secIdx, bIdx, e.target.value)}
                    placeholder="Certification, Award, or Achievement item..."
                    className="flex-1 rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-200 focus:border-emerald-500/60 focus:outline-none"
                  />
                  <button
                    onClick={() => handleRemoveSimpleBullet(secIdx, bIdx)}
                    className="opacity-0 group-hover:opacity-100 rounded p-1 text-zinc-500 hover:text-rose-400 transition-opacity"
                    title="Remove bullet"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Section Body: Paragraph (Summary, Bio) */}
          {sec.type === "paragraph" && (
            <div>
              <textarea
                rows={4}
                value={sec.content || ""}
                onChange={(e) => handleUpdateParagraphContent(secIdx, e.target.value)}
                placeholder="Write summary or section description..."
                className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-200 focus:border-emerald-500/60 focus:outline-none leading-relaxed resize-y"
              />
            </div>
          )}
        </section>
      ))}

      {/* Add New Section Action */}
      <div className="relative pt-2">
        <button
          onClick={() => setShowAddSectionMenu(!showAddSectionMenu)}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-900/60 py-3 text-xs font-semibold text-zinc-400 hover:text-emerald-400 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Resume Section</span>
        </button>

        {showAddSectionMenu && (
          <div className="absolute left-0 right-0 bottom-full mb-2 z-50 rounded-xl border border-zinc-800 bg-zinc-950 p-2 shadow-2xl backdrop-blur-xl grid grid-cols-2 sm:grid-cols-3 gap-1.5 animate-in fade-in zoom-in-95">
            <button
              onClick={() => handleAddNewSection("Work Experience", "subheadings")}
              className="flex items-center gap-2 rounded-lg p-2 text-left text-xs text-zinc-200 hover:bg-zinc-900 hover:text-emerald-400 transition-colors"
            >
              <Briefcase className="h-3.5 w-3.5 text-emerald-400" />
              <span>Work Experience</span>
            </button>

            <button
              onClick={() => handleAddNewSection("Projects", "subheadings")}
              className="flex items-center gap-2 rounded-lg p-2 text-left text-xs text-zinc-200 hover:bg-zinc-900 hover:text-emerald-400 transition-colors"
            >
              <FolderGit2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>Projects</span>
            </button>

            <button
              onClick={() => handleAddNewSection("Education", "subheadings")}
              className="flex items-center gap-2 rounded-lg p-2 text-left text-xs text-zinc-200 hover:bg-zinc-900 hover:text-emerald-400 transition-colors"
            >
              <GraduationCap className="h-3.5 w-3.5 text-emerald-400" />
              <span>Education</span>
            </button>

            <button
              onClick={() => handleAddNewSection("Technical Skills", "key_value")}
              className="flex items-center gap-2 rounded-lg p-2 text-left text-xs text-zinc-200 hover:bg-zinc-900 hover:text-emerald-400 transition-colors"
            >
              <Wrench className="h-3.5 w-3.5 text-emerald-400" />
              <span>Skills (Key-Value)</span>
            </button>

            <button
              onClick={() => handleAddNewSection("Certifications", "bullet_list")}
              className="flex items-center gap-2 rounded-lg p-2 text-left text-xs text-zinc-200 hover:bg-zinc-900 hover:text-emerald-400 transition-colors"
            >
              <Award className="h-3.5 w-3.5 text-emerald-400" />
              <span>Certifications / Awards</span>
            </button>

            <button
              onClick={() => handleAddNewSection("Professional Summary", "paragraph")}
              className="flex items-center gap-2 rounded-lg p-2 text-left text-xs text-zinc-200 hover:bg-zinc-900 hover:text-emerald-400 transition-colors"
            >
              <FileText className="h-3.5 w-3.5 text-emerald-400" />
              <span>Summary / Bio</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
