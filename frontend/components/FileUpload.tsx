"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export default function FileUpload({ onFileSelect, disabled }: FileUploadProps) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted.length > 0) onFileSelect(accepted[0]);
    },
    [onFileSelect],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10 MB
    disabled,
  });

  return (
    <motion.div
      whileHover={{ scale: disabled ? 1 : 1.01 }}
      whileTap={{ scale: disabled ? 1 : 0.99 }}
      {...getRootProps()}
      className={`
        cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-300
        ${isDragActive
          ? "border-brand-500 bg-brand-500/5"
          : "border-gray-300 dark:border-gray-700 hover:border-brand-400 dark:hover:border-brand-500"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      <input {...getInputProps()} />

      {/* Icon */}
      <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-brand-500/10 flex items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-brand-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 16v-8m0 0l-3 3m3-3l3 3M3.5 18.5l.8-5.6a2 2 0 012-1.7h11.4a2 2 0 012 1.7l.8 5.6a1 1 0 01-1 1.2H4.5a1 1 0 01-1-1.2z"
          />
        </svg>
      </div>

      {isDragActive ? (
        <p className="text-brand-500 font-medium">Drop the PDF here…</p>
      ) : (
        <>
          <p className="font-medium text-gray-700 dark:text-gray-200">
            Drag &amp; drop a PDF job posting
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            or <span className="text-brand-500 underline">browse files</span> (max 10 MB)
          </p>
        </>
      )}
    </motion.div>
  );
}
