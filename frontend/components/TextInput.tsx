"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface TextInputProps {
  onSubmit: (text: string) => void;
  disabled?: boolean;
  modelSelector?: React.ReactNode;
}

export default function TextInput({ onSubmit, disabled, modelSelector }: TextInputProps) {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (trimmed.length >= 20) onSubmit(trimmed);
  };

  return (
    <div className="space-y-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste the full job description here…"
        rows={8}
        disabled={disabled}
        className={`
          w-full rounded-xl border px-4 py-3 text-sm leading-relaxed resize-y
          bg-white dark:bg-gray-900
          border-gray-300 dark:border-gray-700
          placeholder-gray-400 dark:placeholder-gray-500
          focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500
          transition-all duration-200
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
      />

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {text.length.toLocaleString()} / 3,000 characters{" "}
          {text.trim().length < 20 && text.length > 0 && (
            <span className="text-amber-500">(min 20)</span>
          )}
          {text.length > 3000 && (
            <span className="text-amber-500"> — will be truncated</span>
          )}
        </span>

        <div className="flex items-center gap-2">
          {modelSelector}

          <motion.button
            whileHover={{ scale: disabled ? 1 : 1.03 }}
            whileTap={{ scale: disabled ? 1 : 0.97 }}
            onClick={handleSubmit}
            disabled={disabled || text.trim().length < 20}
            className={`
              px-6 py-2.5 rounded-xl font-semibold text-sm text-white
              bg-gradient-to-r from-brand-600 to-purple-600
              hover:from-brand-500 hover:to-purple-500
              shadow-lg shadow-brand-500/25
              transition-all duration-200
              disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
            `}
          >
            Analyse Text
          </motion.button>
        </div>
      </div>
    </div>
  );
}
