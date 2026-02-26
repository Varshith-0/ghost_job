"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = stored === "dark" || (!stored && prefersDark);
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.1 }}
      onClick={toggle}
      aria-label="Toggle theme"
      className="relative w-14 h-7 rounded-full bg-gray-300 dark:bg-gray-700 transition-colors duration-300 flex items-center px-1"
    >
      <motion.div
        layout
        className="w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center text-xs"
        style={{ marginLeft: dark ? "auto" : 0 }}
      >
        {dark ? "🌙" : "☀️"}
      </motion.div>
    </motion.button>
  );
}
