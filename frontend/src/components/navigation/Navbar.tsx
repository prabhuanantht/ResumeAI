"use client";

import React, { useState } from "react";
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
  X 
} from "lucide-react";

interface NavbarProps {
  onCompile?: () => void;
  isCompiling?: boolean;
}

export default function Navbar({ onCompile, isCompiling = false }: NavbarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/studio", label: "Studio Editor", icon: Code2 },
    { href: "/tailor", label: "Job Tailor & ATS", icon: Sparkles },
    { href: "/settings", label: "System Prompt", icon: Sliders },
  ];

  return (
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
          {/* Typography Hygiene Pill */}
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

          {/* User Avatar */}
          <div className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 p-1 pl-2 text-xs text-zinc-300">
            <span className="hidden md:inline text-[11px] font-medium text-zinc-400">Alex Mercer</span>
            <div className="h-6 w-6 overflow-hidden rounded-full border border-zinc-700 bg-zinc-800">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80"
                alt="Avatar"
                className="h-full w-full object-cover"
              />
            </div>
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
        </div>
      )}
    </header>
  );
}
