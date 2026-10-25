"use client";

import React, { useState, useEffect } from "react";
import { 
  Key, 
  ExternalLink, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Trash2, 
  X, 
  Sparkles,
  Lock
} from "lucide-react";
import { 
  getStoredApiKey, 
  setStoredApiKey, 
  removeStoredApiKey, 
  testApiKey,
  getSettings,
  updateSettings
} from "@/lib/api";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved?: (key: string) => void;
}

export default function ApiKeyModal({ isOpen, onClose, onKeySaved }: ApiKeyModalProps) {
  const [keyInput, setKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "success" | "error">("idle");
  const [testMessage, setTestMessage] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const existingKey = getStoredApiKey();
      setKeyInput(existingKey);
      setIsSaved(Boolean(existingKey));
      setTestStatus("idle");
      setTestMessage("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestKey = async () => {
    if (!keyInput.trim()) {
      setTestStatus("error");
      setTestMessage("Please enter an API key first.");
      return;
    }

    try {
      setIsTesting(true);
      setTestStatus("idle");
      setTestMessage("");
      const result = await testApiKey(keyInput.trim());
      setTestStatus("success");
      setTestMessage(result.message || "Connected successfully to Google Gemini 3.8 Flash!");
    } catch (err: any) {
      setTestStatus("error");
      setTestMessage(err.message || "Failed to connect with this key. Check your key in Google AI Studio.");
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    const trimmed = keyInput.trim();
    if (!trimmed) {
      removeStoredApiKey();
      setIsSaved(false);
      onKeySaved?.("");
      onClose();
      return;
    }

    // 1. Save strictly in client localStorage
    setStoredApiKey(trimmed);
    setIsSaved(true);

    // 2. Also sync to local SQLite settings if available
    try {
      const current = await getSettings();
      await updateSettings({ ...current, gemini_api_key: trimmed });
    } catch (e) {
      // Local SQLite sync is optional; client localStorage is primary
    }

    onKeySaved?.(trimmed);
    onClose();
  };

  const handleRemove = async () => {
    removeStoredApiKey();
    setKeyInput("");
    setIsSaved(false);
    setTestStatus("idle");
    setTestMessage("");

    try {
      const current = await getSettings();
      await updateSettings({ ...current, gemini_api_key: "" });
    } catch (e) {
      // ignore
    }

    onKeySaved?.("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow accent */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-56 w-56 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-56 w-56 rounded-full bg-indigo-500/15 blur-3xl" />

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-indigo-500/20 border border-emerald-500/30 text-emerald-400">
              <Key className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-white">Google Gemini API Key</h3>
                <span className="rounded-full bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-mono text-emerald-400">
                  100% Free
                </span>
              </div>
              <p className="mt-0.5 text-xs text-zinc-400">
                Powers AI Auto-Boost, ATS Job Tailoring, and Google X-Y-Z rewrites.
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

        {/* 3 Step Instruction Card */}
        <div className="mt-5 rounded-xl border border-zinc-800/90 bg-zinc-900/40 p-4 space-y-3">
          <div className="text-xs font-medium text-zinc-300">How to get your free key in 30 seconds:</div>
          
          <div className="grid gap-2 text-xs text-zinc-400">
            <div className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[11px] font-bold text-zinc-200">1</span>
              <div>
                Go to Google AI Studio at{" "}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
                >
                  aistudio.google.com/app/apikey
                  <ExternalLink className="h-3 w-3 inline" />
                </a>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[11px] font-bold text-zinc-200">2</span>
              <span>
                Sign in with your Google account and click <strong className="text-zinc-200">"Create API key"</strong> (No credit card or billing required).
              </span>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[11px] font-bold text-zinc-200">3</span>
              <span>
                Copy your key (starts with <code className="rounded bg-zinc-800 px-1 py-0.5 font-mono text-[11px] text-zinc-300">AIzaSy...</code>) and paste it below.
              </span>
            </div>
          </div>
        </div>

        {/* Key Input */}
        <div className="mt-5 space-y-2">
          <label className="text-xs font-medium text-zinc-300 flex items-center justify-between">
            <span>Gemini API Key</span>
            {isSaved && (
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                <CheckCircle2 className="h-3 w-3" /> Key active on this device
              </span>
            )}
          </label>

          <div className="relative flex items-center">
            <input
              type={showKey ? "text" : "password"}
              value={keyInput}
              onChange={(e) => {
                setKeyInput(e.target.value);
                setTestStatus("idle");
              }}
              placeholder="Paste your AIzaSy... key here"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900/90 py-2.5 pl-3.5 pr-20 text-xs text-white placeholder-zinc-500 font-mono focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
            
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2.5 p-1 text-zinc-400 hover:text-zinc-200 transition-colors"
              title={showKey ? "Hide key" : "Show key"}
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Test Result Feedback */}
        {testStatus === "success" && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-950/30 p-2.5 text-xs text-emerald-300 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{testMessage}</span>
          </div>
        )}

        {testStatus === "error" && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-950/30 p-2.5 text-xs text-rose-300 animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{testMessage}</span>
          </div>
        )}

        {/* Privacy & Zero-Cloud Assurance Box */}
        <div className="mt-5 rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3.5">
          <div className="flex items-start gap-2.5">
            <div className="rounded-md bg-emerald-950/60 border border-emerald-500/30 p-1 text-emerald-400 shrink-0">
              <Lock className="h-3.5 w-3.5" />
            </div>
            <div className="text-[11px] leading-relaxed text-zinc-400">
              <strong className="text-zinc-200">🔒 100% Client-Side Privacy Guarantee:</strong>
              <p className="mt-0.5">
                Your key is stored <span className="text-zinc-200 font-medium">only in your local browser storage</span> and your local machine. It is never transmitted to any third-party database, never committed to git, and never shared.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-800/80">
          <div className="flex items-center gap-2">
            <button
              onClick={handleTestKey}
              disabled={isTesting || !keyInput.trim()}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all disabled:opacity-40"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-400" />
                  <span>Testing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Test Connection</span>
                </>
              )}
            </button>

            {isSaved && (
              <button
                onClick={handleRemove}
                className="flex items-center gap-1 rounded-lg border border-rose-500/20 bg-rose-950/20 px-2.5 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-950/40 transition-colors"
                title="Remove key from this browser"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Remove</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/20 transition-all"
            >
              <span>Save Key</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}