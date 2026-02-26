"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface RiskMeterProps {
  score: number;
  riskLevel: "Low" | "Medium" | "High";
}

const COLORS = {
  Low: { stroke: "#10b981", glow: "rgba(16,185,129,0.3)" },
  Medium: { stroke: "#f59e0b", glow: "rgba(245,158,11,0.3)" },
  High: { stroke: "#ef4444", glow: "rgba(239,68,68,0.3)" },
};

export default function RiskMeter({ score, riskLevel }: RiskMeterProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const { stroke, glow } = COLORS[riskLevel];

  // Animate number count-up
  useEffect(() => {
    let frame: number;
    const duration = 1200;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(eased * score));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (animatedScore / 100) * circumference;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className="flex flex-col items-center gap-4"
    >
      {/* SVG ring */}
      <div className="relative w-52 h-52">
        <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
          {/* Background track */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            strokeWidth="12"
            className="stroke-gray-200 dark:stroke-gray-800"
          />
          {/* Coloured arc */}
          <motion.circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            strokeWidth="12"
            strokeLinecap="round"
            stroke={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ filter: `drop-shadow(0 0 8px ${glow})` }}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>

        {/* Centre label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-5xl font-bold tabular-nums"
            style={{ color: stroke }}
          >
            {animatedScore}
          </span>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1">
            Fraud Score
          </span>
        </div>
      </div>

      {/* Risk badge */}
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className={`
          inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold border
          ${riskLevel === "Low" ? "risk-bg-low risk-low" : ""}
          ${riskLevel === "Medium" ? "risk-bg-medium risk-medium" : ""}
          ${riskLevel === "High" ? "risk-bg-high risk-high" : ""}
        `}
      >
        <span className="relative flex h-2.5 w-2.5">
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
            style={{ backgroundColor: stroke }}
          />
          <span
            className="inline-flex h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: stroke }}
          />
        </span>
        {riskLevel} Risk
      </motion.div>
    </motion.div>
  );
}
