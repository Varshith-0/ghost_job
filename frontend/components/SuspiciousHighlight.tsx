"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SuspiciousHighlightProps {
  text: string;
  phrases: string[];
}

/**
 * Renders the original job text with suspicious phrases highlighted.
 * Hover shows a tooltip; formatting is preserved via whitespace-pre-wrap.
 */
export default function SuspiciousHighlight({ text, phrases }: SuspiciousHighlightProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const segments = useMemo(() => {
    if (!phrases.length) return [{ text, highlighted: false, phrase: "" }];

    // Build a single regex alternation, escaped & sorted longest-first
    const sorted = [...phrases].sort((a, b) => b.length - a.length);
    const escaped = sorted.map((p) =>
      p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    );
    const re = new RegExp(`(${escaped.join("|")})`, "gi");

    const parts: { text: string; highlighted: boolean; phrase: string }[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = re.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ text: text.slice(lastIndex, match.index), highlighted: false, phrase: "" });
      }
      parts.push({ text: match[0], highlighted: true, phrase: match[0] });
      lastIndex = re.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push({ text: text.slice(lastIndex), highlighted: false, phrase: "" });
    }

    return parts;
  }, [text, phrases]);

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 max-h-72 overflow-y-auto text-sm leading-relaxed whitespace-pre-wrap">
      {segments.map((seg, i) =>
        seg.highlighted ? (
          <span
            key={i}
            className="relative inline"
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <motion.mark
              initial={{ backgroundColor: "rgba(239,68,68,0)" }}
              animate={{ backgroundColor: "rgba(239,68,68,0.2)" }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="bg-red-500/20 text-red-600 dark:text-red-400 rounded px-0.5 font-medium cursor-help border-b border-dashed border-red-400/50"
            >
              {seg.text}
            </motion.mark>

            {/* Tooltip */}
            <AnimatePresence>
              {hoveredIdx === i && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 whitespace-nowrap pointer-events-none"
                >
                  <div className="px-3 py-1.5 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-medium shadow-lg">
                    ⚠️ Suspicious phrase detected
                  </div>
                  <div className="w-2 h-2 bg-gray-900 dark:bg-gray-100 rotate-45 mx-auto -mt-1" />
                </motion.div>
              )}
            </AnimatePresence>
          </span>
        ) : (
          <span key={i} className="text-gray-700 dark:text-gray-300">
            {seg.text}
          </span>
        ),
      )}
    </div>
  );
}
