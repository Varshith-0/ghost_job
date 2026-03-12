"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";

interface ImageUploadProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

const ACCEPTED = {
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/gif": [".gif"],
  "image/webp": [".webp"],
  "image/bmp": [".bmp"],
  "image/tiff": [".tiff", ".tif"],
};

export default function ImageUpload({ onFileSelect, disabled }: ImageUploadProps) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted.length > 0) onFileSelect(accepted[0]);
    },
    [onFileSelect],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10 MB
    disabled,
  });

  return (
    <motion.div
      whileHover={{ scale: disabled ? 1 : 1.01 }}
      whileTap={{ scale: disabled ? 1 : 0.99 }}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(getRootProps() as any)}
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
            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.068 2.068M12 6.75h.008v.008H12V6.75z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
          />
        </svg>
      </div>

      {isDragActive ? (
        <p className="text-brand-500 font-medium">Drop the screenshot here…</p>
      ) : (
        <>
          <p className="font-medium text-gray-700 dark:text-gray-200">
            Drag &amp; drop a screenshot or image
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            or <span className="text-brand-500 underline">browse files</span>{" "}
            (PNG, JPG, WebP — max 10 MB)
          </p>
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
            Text will be extracted via OCR
          </p>
        </>
      )}
    </motion.div>
  );
}
