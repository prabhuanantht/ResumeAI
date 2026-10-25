"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  FileText, 
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

  const navLinks = [
    { href: "/studio", label: "Studio", icon: Code2 },
    { href: "/tailor", label: "Job Tailor & ATS", icon: Sparkles },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-13 max-w-7xl items-center justify-between px-3 sm:px-6">
          {/* Brand */}
          <div className="flex items-center gap-4 sm:gap-7">
            <Link href="/" className="group flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 via-teal-500 to-indigo-500 p-0.5 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <div className="flex h-full w-full items-center justify-center rounded-[6px] bg-zinc-950">
                  <span className="font-mono text-xs font-black text-emerald-400 tracking-tighter">
                    \T/
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-white font-mono text-sm sm:text-base">
                  TeX<span className="text-emerald-400">Craft</span>
                </span>
                <span className="hidden sm:inline-block rounded-full bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-400">
                  Overleaf Grade
                </span>
              </div>
            </Link>

            {/* Nav Links */}
            <nav className="hidden sm:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                      isActive
                        ? "bg-zinc-800 text-white shadow-sm border border-zinc-700/60"
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

          {/* Right Action Icons: Key & Settings Icon */}
          <div className="flex items-center gap-2">
            {/* API Key Modal Button */}
            <button
              onClick={() => setApiKeyModalOpen(true)}
              className="relative flex items-center justify-center h-8 w-8 rounded-lg border border-zinc-800 bg-zinc-900/90 text-zinc-400 hover:border-zinc-700 hover:text-white transition-all shadow-sm"
              title={hasApiKey ? "Gemini API Key Connected (Click to manage)" : "Connect Free Gemini API Key"}
            >
              <Key className="h-4 w-4" />
              {hasApiKey ? (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-zinc-950" />
              ) : (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-amber-400 ring-2 ring-zinc-950" />
              )}
            </button>

            {/* System Prompt / Settings Icon */}
            <Link
              href="/settings"
              className={`flex items-center justify-center h-8 w-8 rounded-lg border transition-all shadow-sm ${
                pathname === "/settings"
                  ? "border-emerald-500/40 bg-zinc-800 text-white"
                  : "border-zinc-800 bg-zinc-900/90 text-zinc-400 hover:border-zinc-700 hover:text-white"
              }`}
              title="System Prompt, AI Governance & Rules"
            >
              <SettingsIcon className="h-4 w-4" />
            </Link>

            {/* Mobile Menu Toggle */}
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

            <Link
              href="/settings"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-zinc-400 hover:bg-zinc-900 hover:text-white"
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
