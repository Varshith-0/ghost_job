"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { AnalysisResult } from "@/lib/api";
import RiskMeter from "./RiskMeter";
import SuspiciousHighlight from "./SuspiciousHighlight";
import FeedbackPanel from "./FeedbackPanel";

interface ResultPanelProps {
  result: AnalysisResult;
  originalText: string;
  modelUsed?: string;
}

export default function ResultPanel({ result, originalText, modelUsed }: ResultPanelProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* ── Model badge ─────────────────────────── */}
      {modelUsed && (
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
            Analysed by {modelUsed}
          </span>
        </div>
      )}

      {/* ── Score Ring ───────────────────────────── */}
      <div className="flex justify-center">
        <RiskMeter score={result.fraud_score} riskLevel={result.risk_level as "Low" | "Medium" | "High"} />
      </div>

      {/* ── Reasons ─────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Analysis Breakdown
        </h3>
        <ul className="space-y-3">
          {result.reasons.map((reason, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="flex gap-3 text-sm"
            >
              <span className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold text-xs flex items-center justify-center">
                {i + 1}
              </span>
              <span className="text-gray-700 dark:text-gray-300">{reason}</span>
            </motion.li>
          ))}
        </ul>
      </div>

      {/* ── Suspicious phrases ──────────────────── */}
      {result.suspicious_phrases.length > 0 && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Suspicious Phrases
          </h3>
          <div className="flex flex-wrap gap-2">
            {result.suspicious_phrases.map((phrase, i) => (
              <motion.span
                key={i}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.08 }}
                className="inline-block px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
              >
                &ldquo;{phrase}&rdquo;
              </motion.span>
            ))}
          </div>
        </div>
      )}

      {/* ── Expandable highlighted text ─────────── */}
      {originalText && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md p-6 space-y-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-brand-500 transition-colors"
          >
            <motion.span
              animate={{ rotate: expanded ? 90 : 0 }}
              className="inline-block text-lg"
            >
              ▸
            </motion.span>
            {expanded ? "Hide" : "Show"} Original Text with Highlights
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <SuspiciousHighlight
                  text={originalText}
                  phrases={result.suspicious_phrases}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── Feedback (RLHF) ────────────────────── */}
      <FeedbackPanel result={result} originalText={originalText} modelUsed={modelUsed || "unknown"} />
    </motion.div>
  );
}
