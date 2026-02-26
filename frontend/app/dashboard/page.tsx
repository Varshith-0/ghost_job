"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import Link from "next/link";

import ThemeToggle from "@/components/ThemeToggle";
import FileUpload from "@/components/FileUpload";
import TextInput from "@/components/TextInput";
import Loader from "@/components/Loader";
import ResultPanel from "@/components/ResultPanel";
import ModelSelector from "@/components/ModelSelector";
import { analyseText, analysePdf, type AnalysisResult } from "@/lib/api";

type Tab = "text" | "pdf";

export default function DashboardPage() {
  const [tab, setTab] = useState<Tab>("text");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [originalText, setOriginalText] = useState("");
  const [selectedModel, setSelectedModel] = useState("");

  const reset = () => {
    setResult(null);
    setOriginalText("");
  };

  // ── Text analysis ──────────────────────────────
  const handleTextSubmit = useCallback(async (text: string) => {
    reset();
    setLoading(true);
    setOriginalText(text);
    try {
      const res = await analyseText(text, selectedModel || undefined);
      if (res.success && res.data) {
        setResult(res.data);
        toast.success("Analysis complete!");
      } else {
        toast.error(res.error ?? "Analysis failed.");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [selectedModel]);

  // ── PDF analysis ───────────────────────────────
  const handleFileSelect = useCallback(async (file: File) => {
    reset();
    setLoading(true);
    try {
      const res = await analysePdf(file, selectedModel || undefined);
      if (res.success && res.data) {
        setResult(res.data);
        setOriginalText("(Extracted from PDF)");
        toast.success("PDF analysed successfully!");
      } else {
        toast.error(res.error ?? "Analysis failed.");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [selectedModel]);

  return (
    <div className="relative min-h-screen">
      {/* Background */}
      <div className="gradient-bg fixed inset-0 -z-10 opacity-20 dark:opacity-10" />

      <Toaster
        position="top-right"
        toastOptions={{
          className: "!bg-white dark:!bg-gray-800 !text-gray-900 dark:!text-gray-100 !shadow-lg",
        }}
      />

      {/* Navbar */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 md:px-12 backdrop-blur-lg bg-white/70 dark:bg-gray-950/70 border-b border-gray-200/50 dark:border-gray-800/50">
        <Link
          href="/"
          className="text-xl font-bold tracking-tight bg-gradient-to-r from-brand-500 to-purple-500 bg-clip-text text-transparent"
        >
          JobShield AI
        </Link>
        <ThemeToggle />
      </nav>

      {/* Main content */}
      <main className="mx-auto max-w-3xl px-4 py-10 md:py-16 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            Fraud Detection Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Upload a PDF or paste the job description text to start analysis.
          </p>
        </div>

        {/* Card */}
        <motion.div
          layout
          className="rounded-3xl border border-gray-200/60 dark:border-gray-700/60 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl shadow-xl shadow-gray-200/40 dark:shadow-black/30 p-6 md:p-8 space-y-6"
        >
          {/* Tabs + Model Selector */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="flex gap-2 p-1 rounded-xl bg-gray-100 dark:bg-gray-800 w-fit">
              {(["text", "pdf"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); reset(); }}
                  disabled={loading}
                  className={`
                    relative px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${tab === t
                      ? "text-white"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                    }
                    disabled:opacity-50
                  `}
                >
                  {tab === t && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 rounded-lg bg-gradient-to-r from-brand-600 to-purple-600"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 capitalize">
                    {t === "pdf" ? "Upload PDF" : "Paste Text"}
                  </span>
                </button>
              ))}
            </div>
            <ModelSelector selected={selectedModel} onSelect={setSelectedModel} />
          </div>

          {/* Input area */}
          <AnimatePresence mode="wait">
            {!loading && !result && (
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {tab === "text" ? (
                  <TextInput onSubmit={handleTextSubmit} disabled={loading} />
                ) : (
                  <FileUpload onFileSelect={handleFileSelect} disabled={loading} />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading state */}
          <AnimatePresence>
            {loading && (
              <motion.div
                key="loader"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Loader message="Scanning for fraud indicators…" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Result */}
          <AnimatePresence>
            {result && !loading && (
              <motion.div
                key="result"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <ResultPanel result={result} originalText={originalText} modelUsed={selectedModel || "default"} />

                <div className="mt-8 flex justify-center">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={reset}
                    className="px-6 py-2.5 rounded-xl text-sm font-semibold border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    Analyse Another Posting
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-gray-400 dark:text-gray-600">
        © {new Date().getFullYear()} JobShield AI — All rights reserved.
      </footer>
    </div>
  );
}
