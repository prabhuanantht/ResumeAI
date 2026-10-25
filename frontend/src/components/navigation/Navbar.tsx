"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Sparkles, 
  Settings as SettingsIcon, 
  Code2, 
  Menu, 
  X,
  Key,
} from "lucide-react";
import ApiKeyModal from "@/components/settings/ApiKeyModal";
import { getStoredApiKey } from "@/lib/api";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    const key = getStoredApiKey();
    setHasApiKey(Boolean(key));
  }, []);

  const handleKeySaved = (key: string) => {
    setHasApiKey(Boolean(key));
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-white/[0.06] bg-zinc-950/70 backdrop-blur-2xl transition-all">
        <div className="mx-auto flex h-11 max-w-7xl items-center justify-between px-3 sm:px-6">
          {/* Brand */}
          <div className="flex items-center gap-4 sm:gap-6">
            <Link href="/" className="group flex items-center gap-2.5 select-none">
              <div className="relative flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)] group-hover:border-emerald-500/50 transition-all">
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold tracking-tight text-zinc-100 font-sans">
                  Resume<span className="text-emerald-400">AI</span>
                </span>
              </div>
            </Link>

            {/* Linear-Style Segmented Navigation Tabs */}
            <nav className="hidden sm:flex items-center rounded-full bg-zinc-900/60 p-0.5 border border-white/[0.06]">
              <Link
                href="/studio"
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  pathname === "/studio"
                    ? "bg-zinc-800 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Code2 className="h-3 w-3" />
                <span>Studio</span>
              </Link>

              <Link
                href="/tailor"
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  pathname === "/tailor"
                    ? "bg-zinc-800 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Sparkles className="h-3 w-3" />
                <span>Tailor & ATS</span>
              </Link>
            </nav>
          </div>

          {/* Right Action Icons: Key & Settings */}
          <div className="flex items-center gap-1.5">
            {/* Key Icon Button */}
            <button
              onClick={() => setApiKeyModalOpen(true)}
              className="relative flex items-center justify-center h-7 w-7 rounded-lg text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200 transition-colors"
              title={hasApiKey ? "Gemini API Key Connected (Click to manage)" : "Connect Free Gemini API Key"}
            >
              <Key className="h-3.5 w-3.5" />
              {hasApiKey ? (
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400 ring-2 ring-zinc-950" />
              ) : (
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-amber-400 ring-2 ring-zinc-950 animate-pulse" />
              )}
            </button>

            {/* Settings Icon Button */}
            <Link
              href="/settings"
              className={`flex items-center justify-center h-7 w-7 rounded-lg transition-colors ${
                pathname === "/settings"
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200"
              }`}
              title="System Prompt, AI Governance & Rules"
            >
              <SettingsIcon className="h-3.5 w-3.5" />
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden rounded-lg p-1 text-zinc-400 hover:bg-zinc-900 hover:text-white"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-zinc-800/80 bg-zinc-950/95 backdrop-blur-xl px-4 py-3 space-y-2 animate-in fade-in">
            <Link
              href="/studio"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${
                pathname === "/studio"
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
              }`}
            >
              <Code2 className="h-4 w-4" />
              <span>Studio</span>
            </Link>

            <Link
              href="/tailor"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${
                pathname === "/tailor"
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
              }`}
            >
              <Sparkles className="h-4 w-4" />
              <span>Job Tailor & ATS</span>
            </Link>

            <Link
              href="/settings"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-zinc-400 hover:bg-zinc-900 hover:text-white"
            >
              <SettingsIcon className="h-4 w-4" />
              <span>System Prompt & Settings</span>
            </Link>
          </div>
        )}
      </header>

      {/* Global API Key Setup Modal */}
      <ApiKeyModal
        isOpen={apiKeyModalOpen}
        onClose={() => setApiKeyModalOpen(false)}
        onKeySaved={handleKeySaved}
      />
    </>
  );
}
