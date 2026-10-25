"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  FileText, 
  Sparkles, 
  Sliders, 
  ShieldCheck, 
  Code2, 
  Cpu, 
  Menu, 
  X,
  Key,
  Lock,
  CheckCircle2
} from "lucide-react";
import ApiKeyModal from "@/components/settings/ApiKeyModal";
import { getStoredApiKey } from "@/lib/api";

interface NavbarProps {
  onCompile?: () => void;
  isCompiling?: boolean;
}

export default function Navbar({ onCompile, isCompiling = false }: NavbarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    // Check local storage for configured Gemini API key
    const key = getStoredApiKey();
    setHasApiKey(Boolean(key));
  }, []);

  const handleKeySaved = (key: string) => {
    setHasApiKey(Boolean(key));
  };

  const navLinks = [
    { href: "/studio", label: "Studio Editor", icon: Code2 },
    { href: "/tailor", label: "Job Tailor & ATS", icon: Sparkles },
    { href: "/settings", label: "System Prompt", icon: Sliders },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-3 sm:px-6">
          {/* Brand */}
          <div className="flex items-center gap-3 sm:gap-6">
            <Link href="/" className="group flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-emerald-400 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <div className="flex h-full w-full items-center justify-center rounded-[6px] bg-zinc-950">
                  <FileText className="h-4 w-4 text-emerald-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-semibold tracking-tight text-white font-mono text-sm">
                    TeX<span className="text-emerald-400">Craft</span>
                  </span>
                  <span className="hidden xs:inline-block rounded-full bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.2 text-[9px] font-mono text-emerald-400">
                    Overleaf Grade
                  </span>
                </div>
              </div>
            </Link>

            {/* Nav Links (Desktop & iPad) */}
            <nav className="hidden sm:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-zinc-800/90 text-white shadow-sm border border-zinc-700/60"
                        : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 text-zinc-400" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Zero Em Dashes Badge */}
            <div className="hidden xl:flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/30 px-2.5 py-1 text-[11px] font-mono text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>0 Em Dashes</span>
            </div>

            {/* Compile button if in editor */}
            {onCompile && (
              <button
                onClick={onCompile}
                disabled={isCompiling}
                className="flex items-center gap-1.5 rounded-md bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-2.5 sm:px-3 py-1.5 text-xs font-semibold shadow-sm transition-all disabled:opacity-50 touch-manipulation"
              >
                <Cpu className={`h-3.5 w-3.5 ${isCompiling ? "animate-spin" : ""}`} />
                <span>{isCompiling ? "Compiling..." : "Recompile"}</span>
                <kbd className="hidden md:inline-block rounded bg-emerald-600/30 px-1 text-[9px] font-mono">
                  ⌘S
                </kbd>
              </button>
            )}

            {/* Gemini API Key Status Button (Replaces mock Alex Mercer account) */}
            {hasApiKey ? (
              <button
                onClick={() => setApiKeyModalOpen(true)}
                className="flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-950/40 px-3 py-1 text-xs text-emerald-300 hover:bg-emerald-900/40 transition-colors shadow-sm"
                title="Google Gemini 3.8 Flash Active. Click to manage key."
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-mono text-[11px] hidden xs:inline">Gemini 3.8</span>
                <span className="text-[10px] text-emerald-400/80 font-mono">Active</span>
              </button>
            ) : (
              <button
                onClick={() => setApiKeyModalOpen(true)}
                className="relative flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-950/30 px-3 py-1 text-xs font-medium text-amber-300 hover:bg-amber-900/40 transition-all shadow-sm"
                title="Connect free Gemini API key to enable AI Auto-Boost and Job Tailoring"
              >
                <Key className="h-3 w-3 text-amber-400" />
                <span className="text-[11px]">Connect Gemini</span>
                <span className="rounded bg-amber-500/20 px-1 py-0.2 text-[9px] font-mono text-amber-300">Free</span>
              </button>
            )}

            {/* Local Privacy indicator */}
            <div 
              className="hidden lg:flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-900/80 px-2 py-1 text-[10px] text-zinc-400 font-mono"
              title="All resume drafts, scoring, and API keys are cached strictly on your local device."
            >
              <Lock className="h-2.5 w-2.5 text-zinc-400" />
              <span>Local Storage</span>
            </div>

            {/* Mobile / Compact Tablet Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden rounded-lg border border-zinc-800 bg-zinc-900 p-1.5 text-zinc-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-zinc-800 bg-zinc-950 px-4 py-3 space-y-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium ${
                    isActive
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            <div className="pt-2 border-t border-zinc-800/80">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setApiKeyModalOpen(true);
                }}
                className="w-full flex items-center justify-between rounded-md bg-zinc-900 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800"
              >
                <div className="flex items-center gap-2">
                  <Key className="h-3.5 w-3.5 text-amber-400" />
                  <span>Gemini API Key</span>
                </div>
                <span className="font-mono text-[10px] text-zinc-400">
                  {hasApiKey ? "Active" : "Set Key"}
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
