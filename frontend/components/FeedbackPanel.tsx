"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { submitFeedback, type FeedbackPayload, type AnalysisResult } from "@/lib/api";

interface FeedbackPanelProps {
  result: AnalysisResult;
  originalText: string;
  modelUsed: string;
  onFeedbackSubmitted?: () => void;
}

type Step = "prompt" | "form" | "submitted" | "confirmed";

function riskFromScore(score: number): "Low" | "Medium" | "High" {
  if (score <= 30) return "Low";
  if (score <= 70) return "Medium";
  return "High";
}

export default function FeedbackPanel({
  result,
  originalText,
  modelUsed,
  onFeedbackSubmitted,
}: FeedbackPanelProps) {
  const [step, setStep] = useState<Step>("prompt");
  const [isFraud, setIsFraud] = useState<boolean | null>(null);
  const [correctedScore, setCorrectedScore] = useState(result.fraud_score);
  const [explanation, setExplanation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (isFraud === null || !explanation.trim()) return;

    setSubmitting(true);
    setError("");

    try {
      const payload: FeedbackPayload = {
        job_text: originalText,
        model_used: modelUsed,
        original_score: result.fraud_score,
        original_risk: result.risk_level,
        original_reasons: result.reasons,
        corrected_score: correctedScore,
        corrected_risk: riskFromScore(correctedScore),
        is_fraud: isFraud,
        user_explanation: explanation.trim(),
      };

      await submitFeedback(payload);
      setStep("submitted");
      onFeedbackSubmitted?.();
    } catch (err: any) {
      setError(err.message ?? "Failed to submit feedback.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md p-6 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-lg">🧠</span>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Teach the AI
        </h3>
        <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-medium">
          RLHF
        </span>
      </div>

      <AnimatePresence mode="wait">
        {/* ── Step 1: Quick prompt ───────────────── */}
        {step === "prompt" && (
          <motion.div
            key="prompt"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Was this analysis accurate? Your feedback teaches <strong>all models</strong> instantly.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setStep("confirmed")}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-green-500/30 bg-green-500/5 hover:bg-green-500/15 text-green-700 dark:text-green-400 text-sm font-semibold transition-all"
              >
                <span className="text-lg">👍</span>
                Accurate
              </button>
              <button
                onClick={() => setStep("form")}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-red-500/30 bg-red-500/5 hover:bg-red-500/15 text-red-700 dark:text-red-400 text-sm font-semibold transition-all"
              >
                <span className="text-lg">👎</span>
                Not Accurate — Teach AI
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Step 2: Detailed form ─────────────── */}
        {step === "form" && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-5"
          >
            {/* Is this actually fraud? */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Is this job posting actually fraudulent?
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsFraud(true);
                    if (correctedScore < 50) setCorrectedScore(75);
                  }}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                    isFraud === true
                      ? "border-red-500 bg-red-500/15 text-red-700 dark:text-red-400"
                      : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-red-300"
                  }`}
                >
                  🚨 Yes, it&apos;s fraud
                </button>
                <button
                  onClick={() => {
                    setIsFraud(false);
                    if (correctedScore > 50) setCorrectedScore(15);
                  }}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                    isFraud === false
                      ? "border-green-500 bg-green-500/15 text-green-700 dark:text-green-400"
                      : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-green-300"
                  }`}
                >
                  ✅ No, it&apos;s legitimate
                </button>
              </div>
            </div>

            {/* Corrected score slider */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                What should the fraud score be?
              </label>
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-500 w-12">0 (Safe)</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={correctedScore}
                  onChange={(e) => setCorrectedScore(Number(e.target.value))}
                  className="flex-1 accent-purple-500 h-2"
                />
                <span className="text-xs text-gray-500 w-16 text-right">100 (Fraud)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  Original: {result.fraud_score} → Corrected: {correctedScore}
                </span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    correctedScore > 70
                      ? "bg-red-500/10 text-red-600"
                      : correctedScore > 30
                      ? "bg-yellow-500/10 text-yellow-600"
                      : "bg-green-500/10 text-green-600"
                  }`}
                >
                  {riskFromScore(correctedScore)}
                </span>
              </div>
            </div>

            {/* Explanation */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Explain why (this teaches the AI)
              </label>
              <textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder={
                  isFraud
                    ? "e.g., This asks for personal bank details upfront, has unrealistic salary, and the company doesn't exist..."
                    : "e.g., This is a real company (Google), the salary is reasonable for the role, and it has specific requirements..."
                }
                rows={3}
                maxLength={1000}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40 resize-none"
              />
              <span className="text-xs text-gray-400">{explanation.length}/1000</span>
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setStep("prompt")}
                disabled={submitting}
                className="px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || isFraud === null || explanation.trim().length < 5}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-brand-600 hover:from-purple-500 hover:to-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/20"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Submitting…
                  </span>
                ) : (
                  "Submit Feedback — Teach All Models"
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Step 3a: Accurate confirmation ──── */}
        {step === "confirmed" && (
          <motion.div
            key="confirmed"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-3 space-y-2"
          >
            <span className="text-3xl">✅</span>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Great, glad the analysis was accurate!
            </p>
          </motion.div>
        )}

        {/* ── Step 3b: Feedback submitted ─────────── */}
        {step === "submitted" && (
          <motion.div
            key="submitted"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-4 space-y-3"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              className="text-4xl"
            >
              🎓
            </motion.div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Thank you!
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              Your feedback has been saved. <strong>Every model</strong> (Qwen, Mistral, etc.)
              will now use this correction when analysing similar postings.
            </p>
            <div className="flex items-center justify-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
              Learning applied instantly
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
