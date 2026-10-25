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
  Home,
  FileText
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
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-white/[0.06] bg-zinc-950/80 backdrop-blur-2xl transition-all">
        <div className="mx-auto flex h-11 max-w-7xl items-center justify-between px-3 sm:px-6">
          {/* Brand */}
          <div className="flex items-center gap-3 sm:gap-6">
            <Link href="/" className="group flex items-center gap-2 select-none">
              <div className="relative flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)] group-hover:border-emerald-500/50 transition-all shrink-0">
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold tracking-tight text-zinc-100 font-sans">
                  Resume<span className="text-emerald-400">AI</span>
                </span>
              </div>
            </Link>

            {/* Desktop Segmented Navigation Tabs */}
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

          {/* Right Action Icons: Key, Settings & Mobile Menu */}
          <div className="flex items-center gap-1.5">
            {/* Key Icon Button with mobile badge */}
            <button
              onClick={() => setApiKeyModalOpen(true)}
              className="relative flex items-center justify-center h-8 w-8 sm:h-7 sm:w-7 rounded-lg text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200 transition-colors touch-manipulation"
              title={hasApiKey ? "Gemini API Key Connected (Click to manage)" : "Connect Free Gemini API Key"}
            >
              <Key className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
              {hasApiKey ? (
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400 ring-2 ring-zinc-950" />
              ) : (
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-amber-400 ring-2 ring-zinc-950 animate-pulse" />
              )}
            </button>

            {/* Settings Icon Button */}
            <Link
              href="/settings"
              className={`flex items-center justify-center h-8 w-8 sm:h-7 sm:w-7 rounded-lg transition-colors touch-manipulation ${
                pathname === "/settings"
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200"
              }`}
              title="System Prompt, AI Governance & Rules"
            >
              <SettingsIcon className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
            </Link>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors touch-manipulation"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu (Secondary destinations & Quick actions) */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-zinc-800/80 bg-zinc-950/98 backdrop-blur-2xl px-4 py-3 space-y-2 animate-in slide-in-from-top-2 duration-150">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-semibold ${
                pathname === "/"
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
              }`}
            >
              <Home className="h-4 w-4 text-emerald-400" />
              <span>Home & Templates</span>
            </Link>

            <Link
              href="/studio"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-semibold ${
                pathname === "/studio"
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
              }`}
            >
              <Code2 className="h-4 w-4 text-emerald-400" />
              <span>Resume Studio</span>
            </Link>

            <Link
              href="/tailor"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-semibold ${
                pathname === "/tailor"
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
              }`}
            >
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <span>Job Tailor & ATS Engine</span>
            </Link>

            <Link
              href="/settings"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-semibold ${
                pathname === "/settings"
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
              }`}
            >
              <SettingsIcon className="h-4 w-4 text-zinc-400" />
              <span>System Prompt & Governance</span>
            </Link>

            <div className="pt-2 border-t border-zinc-800/60">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setApiKeyModalOpen(true);
                }}
                className="w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium text-zinc-300 bg-zinc-900/60 border border-zinc-800"
              >
                <div className="flex items-center gap-2">
                  <Key className="h-3.5 w-3.5 text-amber-400" />
                  <span>Gemini API Key</span>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${hasApiKey ? "bg-emerald-950 text-emerald-400 border border-emerald-500/30" : "bg-amber-950 text-amber-400 border border-amber-500/30"}`}>
                  {hasApiKey ? "Connected" : "Free Key Needed"}
                </span>
              </button>
            </div>
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
