"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/navigation/Navbar";
import { getSettings, updateSettings, SettingsModel } from "@/lib/api";
import { 
  Sliders, 
  Sparkles, 
  ShieldAlert, 
  Save, 
  RotateCcw, 
  Key, 
  Cpu, 
  Check, 
  X,
  Plus,
  HelpCircle
} from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsModel>({
    system_prompt: "",
    forbidden_words: ["spearheaded", "synergized", "leverage", "game-changing", "tapestry", "delve"],
    enforce_no_em_dashes: true,
    gemini_model: "gemini-2.5-flash",
    gemini_api_key: "",
  });
  const [newWord, setNewWord] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await getSettings();
        setSettings(data);
      } catch (e) {
        console.error("Failed to load settings:", e);
      }
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await updateSettings(settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (e: any) {
      alert("Failed to save settings: " + (e.message || e));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddForbiddenWord = () => {
    if (!newWord.trim()) return;
    const clean = newWord.trim().toLowerCase();
    if (!settings.forbidden_words.includes(clean)) {
      setSettings({
        ...settings,
        forbidden_words: [...settings.forbidden_words, clean],
      });
    }
    setNewWord("");
  };

  const handleRemoveWord = (word: string) => {
    setSettings({
      ...settings,
      forbidden_words: settings.forbidden_words.filter((w) => w !== word),
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs font-mono text-zinc-300">
              <Sliders className="h-3.5 w-3.5 text-emerald-400" />
              <span>AI Governance & Custom Rules</span>
            </div>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">
              System Prompt & Model Controls
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Customize how Gemini tailors your resumes. Enforce strict constraints, eliminate recurring errors, and manage API keys.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-5 py-2.5 text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
          >
            {saveSuccess ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            <span>{saveSuccess ? "Saved Settings!" : isSaving ? "Saving..." : "Save Settings"}</span>
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Custom System Prompt Section */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Custom AI System Prompt
                </h3>
                <p className="text-xs text-zinc-400">
                  Direct instructions given to Gemini during every resume generation and edit.
                </p>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded">
                Active
              </span>
            </div>

            <textarea
              rows={9}
              value={settings.system_prompt}
              onChange={(e) => setSettings({ ...settings, system_prompt: e.target.value })}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs text-zinc-200 leading-relaxed placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <p className="text-[11px] text-zinc-500 font-mono">
              Tip: If the AI makes repetitive phrasing errors or adds unwanted buzzwords, add explicit instructions here (e.g. &ldquo;Never format bullet dates with words like &apos;Summer&apos;, use &apos;May 2023 -- Aug 2023&apos;&rdquo;).
            </p>
          </div>

          {/* Negative Constraints & Forbidden Buzzwords */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Negative Constraints & Typography Hygiene
              </h3>
              <p className="text-xs text-zinc-400">
                AI hallmarks and forbidden clichés strictly stripped from the generated LaTeX.
              </p>
            </div>

            {/* Strict Em Dash Toggle */}
            <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/80 p-3.5">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-emerald-400" />
                  Strictly Disallow Em Dashes (&ldquo;—&rdquo;)
                </span>
                <p className="text-[11px] text-zinc-400">
                  Enforces pure LaTeX standards. Em dashes cause compilation issues and ATS parsing breaks; replaces them with LaTeX en dashes (&ldquo;--&rdquo;).
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.enforce_no_em_dashes}
                onChange={(e) => setSettings({ ...settings, enforce_no_em_dashes: e.target.checked })}
                className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500"
              />
            </div>

            {/* Forbidden Words Manager */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-2">
                Forbidden Overused AI Buzzwords
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {settings.forbidden_words.map((word) => (
                  <span
                    key={word}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-950/20 px-2.5 py-1 text-xs font-mono text-rose-300"
                  >
                    <span>{word}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveWord(word)}
                      className="text-rose-400 hover:text-rose-200"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2 max-w-sm">
                <input
                  type="text"
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddForbiddenWord();
                    }
                  }}
                  placeholder="Add forbidden word (e.g. passionate)..."
                  className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddForbiddenWord}
                  className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-800"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Gemini LLM API Configuration */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">
                Google Gemini Model & API Key
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Gemini Model Choice
                </label>
                <select
                  value={settings.gemini_model}
                  onChange={(e) => setSettings({ ...settings, gemini_model: e.target.value })}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-200 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended: Ultra-fast & high context)</option>
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fast, free-tier friendly)</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep reasoning)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Gemini API Key (Optional / Free)
                </label>
                <div className="relative">
                  <input
                    type={showKey ? "text" : "password"}
                    value={settings.gemini_api_key}
                    onChange={(e) => setSettings({ ...settings, gemini_api_key: e.target.value })}
                    placeholder="AIzaSy... (Leave empty to use built-in engine)"
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-200 font-mono placeholder-zinc-500 focus:border-emerald-500 focus:outline-none pr-16"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2 top-2 text-[10px] font-mono text-zinc-400 hover:text-zinc-200"
                  >
                    {showKey ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-zinc-500 font-mono">
              You can get a free Gemini API key anytime from Google AI Studio (aistudio.google.com). Even without an API key, the builder operates with a high-fidelity local algorithmic engine.
            </p>
          </div>
        </form>
      </main>
    </div>
  );
}
