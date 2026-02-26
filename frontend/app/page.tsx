"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

export default function HomePage() {
  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Animated gradient background */}
      <div className="gradient-bg fixed inset-0 -z-10 opacity-30 dark:opacity-20" />

      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 md:px-12">
        <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-brand-500 to-purple-500 bg-clip-text text-transparent">
          JobShield AI
        </span>
        <ThemeToggle />
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-2xl space-y-6"
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Stop Falling for{" "}
            <span className="bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">
              Fake Jobs
            </span>
          </h1>

          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-lg mx-auto leading-relaxed">
            Upload a job posting or paste it below — our local AI analyses it in
            seconds and tells you exactly how suspicious it is.
          </p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl text-white font-semibold text-base
                bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500
                shadow-xl shadow-brand-500/25 hover:shadow-brand-500/40
                transition-all duration-300"
            >
              Get Started
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
          </motion.div>
        </motion.div>

        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-purple-500/20 blur-3xl" />
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-gray-400 dark:text-gray-600">
        © {new Date().getFullYear()} JobShield AI — All rights reserved.
      </footer>
    </div>
  );
}
