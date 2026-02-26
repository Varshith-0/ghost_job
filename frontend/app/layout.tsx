import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "JobShield AI — Detect Fake Job Postings",
  description:
    "AI-powered job-posting fraud detection. Upload a PDF or paste text to get an instant risk analysis.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
