"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getModels, type ModelInfo } from "@/lib/api";

interface ModelSelectorProps {
  selected: string;
  onSelect: (model: string) => void;
}

/** Shorten Ollama model names for display */
function shortName(name: string): string {
  // "qwen3.5:4b" → "Qwen 3.5 4B"
  if (name.startsWith("qwen")) {
    const ver = name.match(/qwen([\d.]*)/)?.[1] ?? "";
    const size = name.match(/:(\w+)/)?.[1]?.toUpperCase() ?? "";
    return `Qwen ${ver} ${size}`.trim();
  }
  // "llama3.2:3b" → "Llama 3.2 3B"
  if (name.startsWith("llama")) {
    const ver = name.match(/llama([\d.]*)/)?.[1] ?? "";
    const size = name.match(/:(\w+)/)?.[1]?.toUpperCase() ?? "";
    return `Llama ${ver} ${size}`.trim();
  }
  // fallback: capitalise first part before ':'
  const base = name.split(":")[0];
  return base.charAt(0).toUpperCase() + base.slice(1);
}

/** Only show Llama and Qwen models */
function filterAllowed(models: ModelInfo[]): ModelInfo[] {
  return models.filter(
    (m) => m.name.startsWith("llama") || m.name.startsWith("qwen")
  );
}

function timeLabel(m: ModelInfo): string {
  if (m.avg_time != null) return `~${m.avg_time}s`;
  // estimate from size
  if (m.size_mb < 1500) return "~3-5s";
  if (m.size_mb < 6000) return "~15-30s";
  return "~40s+";
}

export default function ModelSelector({ selected, onSelect }: ModelSelectorProps) {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getModels()
      .then((res) => {
        setModels(filterAllowed(res.models));
        if (!selected) onSelect(res.default);
      })
      .catch(() => {
        // Backend might be down — show empty so user can retry
        setModels([]);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /** Refresh stats on open */
  const toggle = () => {
    // Always try to (re)fetch models when opening
    getModels()
      .then((r) => {
        setModels(filterAllowed(r.models));
        if (!selected && r.default) onSelect(r.default);
      })
      .catch(() => {});
    setOpen(!open);
  };

  const current = models.find((m) => m.name === selected);

  if (loading) return <div className="h-[38px] w-28 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />;

  return (
    <div className="relative" ref={ref}>
      {/* Compact trigger button */}
      <button
        type="button"
        onClick={toggle}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium
                   border border-gray-300 dark:border-gray-600
                   text-gray-700 dark:text-gray-300
                   hover:bg-gray-100 dark:hover:bg-gray-800
                   transition-colors whitespace-nowrap"
      >
        <svg className="w-4 h-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714a2.25 2.25 0 0 0 .659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-1.537 4.612a2.25 2.25 0 0 1-2.136 1.538H8.673a2.25 2.25 0 0 1-2.136-1.538L5 14.5m14 0H5" />
        </svg>
        <span>{current ? shortName(current.name) : models.length === 0 ? "Select Model" : "Model"}</span>
        <svg
          className={`w-3.5 h-3.5 opacity-60 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 bottom-full mb-2 z-50 min-w-[220px] rounded-xl border
                       border-gray-200 dark:border-gray-700
                       bg-white dark:bg-gray-900 shadow-xl overflow-hidden"
          >
            {models.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center space-y-1">
                <p className="font-medium text-gray-700 dark:text-gray-300">No models found</p>
                <p className="text-xs">Make sure Ollama is running and the backend is started.</p>
              </div>
            ) : (
            models.map((m) => {
              const isSelected = m.name === selected;
              return (
                <button
                  key={m.name}
                  type="button"
                  onClick={() => { onSelect(m.name); setOpen(false); }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left text-sm
                    transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-950/40
                    ${isSelected ? "bg-indigo-50 dark:bg-indigo-950/30 font-semibold" : ""}`}
                >
                  <span className="text-gray-800 dark:text-gray-200">
                    {shortName(m.name)}
                  </span>
                  <span className={`text-xs ml-3 ${
                    m.avg_time != null
                      ? m.avg_time <= 5
                        ? "text-green-600 dark:text-green-400"
                        : m.avg_time <= 15
                          ? "text-yellow-600 dark:text-yellow-400"
                          : "text-red-500 dark:text-red-400"
                      : "text-gray-400 dark:text-gray-500"
                  }`}>
                    {timeLabel(m)}
                  </span>
                </button>
              );
            })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
