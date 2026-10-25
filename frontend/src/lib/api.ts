export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const STORAGE_KEYS = {
  GEMINI_API_KEY: "texcraft_gemini_api_key",
  LATEX_DRAFT: "texcraft_latex_draft",
  TARGET_JD: "texcraft_target_jd",
  CACHED_SCORE: "texcraft_cached_score",
};

export function getStoredApiKey(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(STORAGE_KEYS.GEMINI_API_KEY) || "";
}

export function setStoredApiKey(key: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.GEMINI_API_KEY, key.trim());
}

export function removeStoredApiKey(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.GEMINI_API_KEY);
}

export function getStoredDraft(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(STORAGE_KEYS.LATEX_DRAFT) || "";
}

export function setStoredDraft(code: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.LATEX_DRAFT, code);
}

export function getStoredTargetJd(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(STORAGE_KEYS.TARGET_JD) || "";
}

export function setStoredTargetJd(jd: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.TARGET_JD, jd);
}

export function getAuthHeaders(): Record<string, string> {
  const key = getStoredApiKey();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (key) {
    headers["X-Gemini-Key"] = key;
  }
  return headers;
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string;
  github: string;
  linkedin: string;
  website: string;
  primary_latex: string;
  skills: string[];
  created_at?: string;
  updated_at?: string;
}

export interface SkillGapItem {
  skill: string;
  importance: "critical" | "high" | "nice_to_have";
  category: string;
  prompt_question: string;
  learning_roadmap: string;
  status: "pending" | "confirmed_add" | "declined";
  user_note?: string;
}

export interface AtsBreakdown {
  overall_score: number;
  keyword_match_score: number;
  impact_metrics_score: number;
  action_verbs_score: number;
  formatting_hygiene_score: number;
  matched_keywords: string[];
  missing_keywords: string[];
  detected_em_dashes: number;
  feedback_notes: string[];
}

export interface TailorResponse {
  id: string;
  job_title: string;
  company: string;
  tailored_latex: string;
  ats_score: number;
  ats_breakdown: AtsBreakdown;
  matched_keywords: string[];
  missing_skills: SkillGapItem[];
  diff_summary: string[];
  status: string;
}

export interface SettingsModel {
  system_prompt: string;
  forbidden_words: string[];
  enforce_no_em_dashes: boolean;
  gemini_model: string;
  gemini_api_key: string;
}

export async function getProfile(): Promise<Profile> {
  const res = await fetch(`${API_BASE}/api/resumes/profile`);
  if (!res.ok) throw new Error("Failed to load user profile");
  return res.json();
}

export async function updateProfile(profile: Profile): Promise<Profile> {
  const res = await fetch(`${API_BASE}/api/resumes/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });
  if (!res.ok) throw new Error("Failed to save profile");
  return res.json();
}

export async function listTailoredResumes(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/api/resumes/tailored`);
  if (!res.ok) return [];
  return res.json();
}

export async function getTailoredResume(id: string): Promise<TailorResponse> {
  const res = await fetch(`${API_BASE}/api/resumes/tailored/${id}`);
  if (!res.ok) throw new Error("Failed to fetch tailored resume");
  return res.json();
}

export async function scrapeJobUrl(url: string): Promise<{ job_title: string; company: string; description: string }> {
  const res = await fetch(`${API_BASE}/api/tailor/scrape`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) throw new Error("Failed to scrape job URL");
  return res.json();
}

export async function generateTailoredResume(payload: {
  job_title?: string;
  company?: string;
  job_description?: string;
  job_url?: string;
  base_latex?: string;
  user_system_prompt?: string;
  variance_level?: string;
  confirmed_skills?: string[];
  declined_skills?: string[];
  skill_notes?: Record<string, string>;
}): Promise<TailorResponse> {
  const res = await fetch(`${API_BASE}/api/tailor/generate`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || "Tailoring failed");
  }
  return res.json();
}

export async function chatEditResume(payload: {
  current_latex: string;
  instruction: string;
  job_description?: string;
  user_system_prompt?: string;
}): Promise<{ updated_latex: string; explanation: string; changes: string[] }> {
  const res = await fetch(`${API_BASE}/api/tailor/chat-edit`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("AI refinement failed");
  return res.json();
}

export async function scoreResume(payload: {
  latex_code: string;
  job_description?: string;
}): Promise<AtsBreakdown> {
  const res = await fetch(`${API_BASE}/api/resumes/score`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Resume scoring failed");
  return res.json();
}

export async function autoBoostResume(payload: {
  latex_code: string;
  target_jd?: string;
}): Promise<{
  updated_latex: string;
  explanation: string;
  changes: string[];
  original_score: number;
  boosted_score: number;
  ats_breakdown: AtsBreakdown;
}> {
  const res = await fetch(`${API_BASE}/api/resumes/auto-boost`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Auto-boost failed");
  return res.json();
}

export async function compilePdf(latexCode: string, filename = "resume"): Promise<Blob> {
  const res = await fetch(`${API_BASE}/api/compile/pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ latex_code: latexCode, filename }),
  });
  if (!res.ok) {
    const errorMsg = await res.text();
    throw new Error(errorMsg || "PDF compilation failed");
  }
  return res.blob();
}

export async function compileDocx(latexCode: string, filename = "resume"): Promise<Blob> {
  const res = await fetch(`${API_BASE}/api/compile/docx`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ latex_code: latexCode, filename }),
  });
  if (!res.ok) throw new Error("Word export failed");
  return res.blob();
}

export async function validateLatex(latexCode: string): Promise<{ valid: boolean; errors: any[]; fixes_applied: string[] }> {
  const res = await fetch(`${API_BASE}/api/compile/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ latex_code: latexCode }),
  });
  return res.json();
}

export async function getSettings(): Promise<SettingsModel> {
  const res = await fetch(`${API_BASE}/api/settings`);
  if (!res.ok) throw new Error("Failed to fetch settings");
  return res.json();
}

export async function updateSettings(settings: SettingsModel): Promise<SettingsModel> {
  const res = await fetch(`${API_BASE}/api/settings`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error("Failed to save settings");
  return res.json();
}

export async function testApiKey(
  apiKey: string,
  model = "gemini-3.8-flash"
): Promise<{ valid: boolean; model: string; message: string; response: string }> {
  const res = await fetch(`${API_BASE}/api/settings/test-key`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: apiKey, model }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Connection test failed." }));
    throw new Error(err.detail || "API Key verification failed.");
  }
  return res.json();
}
