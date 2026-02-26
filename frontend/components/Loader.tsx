"use client";

import { motion } from "framer-motion";

export default function Loader({ message = "Analysing…" }: { message?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-6 py-16"
    >
      {/* Animated rings */}
      <div className="relative w-24 h-24">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="absolute inset-0 rounded-full border-4 border-transparent border-t-brand-500 border-r-brand-300"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
          className="absolute inset-2 rounded-full border-4 border-transparent border-b-purple-500 border-l-purple-300"
        />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
          className="absolute inset-4 rounded-full border-4 border-transparent border-t-pink-500 border-r-pink-300"
        />
        {/* Centre dot */}
        <motion.div
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="absolute inset-0 m-auto w-3 h-3 rounded-full bg-brand-500"
        />
      </div>

      {/* Text */}
      <div className="text-center space-y-1">
        <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
          {message}
        </p>
      </div>

      {/* Shimmer bar */}
      <div className="w-64 h-1.5 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
        <motion.div
          animate={{ x: ["-100%", "100%"] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="h-full w-1/2 rounded-full bg-gradient-to-r from-brand-500 via-purple-500 to-pink-500"
        />
      </div>
    </motion.div>
  );
}
