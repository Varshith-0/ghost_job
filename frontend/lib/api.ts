/**
 * JobShield AI — API client
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

// ── Types ────────────────────────────────────────────────────────

export interface AnalysisResult {
  fraud_score: number;
  risk_level: "Low" | "Medium" | "High";
  reasons: string[];
  suspicious_phrases: string[];
}

export interface AnalysisResponse {
  success: boolean;
  data: AnalysisResult | null;
  error: string | null;
}

export interface ModelInfo {
  name: string;
  size_mb: number;
  avg_time: number | null;
}

export interface ModelsResponse {
  models: ModelInfo[];
  default: string;
}

// ── Helper: build analysis FormData ─────────────────────────────

function buildForm(opts: { file?: File; text?: string; model?: string }): FormData {
  const form = new FormData();
  if (opts.file) form.append("file", opts.file);
  if (opts.text) form.append("text", opts.text);
  if (opts.model) form.append("model", opts.model);
  return form;
}

async function postAnalyze(form: FormData): Promise<AnalysisResponse> {
  const res = await fetch(`${API_BASE}/analyze`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.detail ?? `Server error (${res.status})`);
  }

  return res.json();
}

// ── Analysis functions ──────────────────────────────────────────

/** Analyse plain-text job description */
export async function analyseText(text: string, model?: string): Promise<AnalysisResponse> {
  return postAnalyze(buildForm({ text, model }));
}

/** Analyse an uploaded PDF file */
export async function analysePdf(file: File, model?: string): Promise<AnalysisResponse> {
  return postAnalyze(buildForm({ file, model }));
}

/** Analyse both PDF + text together */
export async function analyseBoth(file: File, text: string, model?: string): Promise<AnalysisResponse> {
  return postAnalyze(buildForm({ file, text, model }));
}

// ── Models ──────────────────────────────────────────────────────

/** Fetch available Ollama models with average response times */
export async function getModels(): Promise<ModelsResponse> {
  const res = await fetch(`${API_BASE}/models`);
  if (!res.ok) {
    throw new Error(`Failed to fetch models (${res.status})`);
  }
  return res.json();
}

// ── Health ──────────────────────────────────────────────────────

/** Health-check */
export async function healthCheck(): Promise<{ status: string; version: string; model: string }> {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

// ── Feedback (RLHF) ────────────────────────────────────────────

export interface FeedbackPayload {
  job_text: string;
  model_used: string;
  original_score: number;
  original_risk: string;
  original_reasons: string[];
  corrected_score: number;
  corrected_risk: string;
  is_fraud: boolean;
  user_explanation: string;
}

export interface FeedbackResponse {
  success: boolean;
  message: string;
  feedback_id: string | null;
}

export interface FeedbackStats {
  total_feedback: number;
  fraud_corrections: number;
  legit_corrections: number;
  avg_score_delta: number;
  fraud_patterns_count: number;
  legit_patterns_count: number;
}

/** Submit user feedback to teach all models */
export async function submitFeedback(payload: FeedbackPayload): Promise<FeedbackResponse> {
  const res = await fetch(`${API_BASE}/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.detail ?? `Feedback failed (${res.status})`);
  }
  return res.json();
}

/** Get feedback statistics */
export async function getFeedbackStats(): Promise<FeedbackStats> {
  const res = await fetch(`${API_BASE}/feedback/stats`);
  if (!res.ok) {
    throw new Error(`Failed to fetch feedback stats (${res.status})`);
  }
  return res.json();
}
