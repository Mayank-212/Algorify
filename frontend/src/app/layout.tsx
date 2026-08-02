import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Algorify — Your AI Learning Twin",
  description:
    "An AI-powered personalized learning platform that creates a digital learning twin for every student. Adaptive tutoring, smart quizzes, and intelligent study planning.",
  keywords: [
    "AI learning",
    "personalized education",
    "adaptive learning",
    "AI tutor",
    "study planner",
    "quiz generator",
  ],
  authors: [{ name: "Algorify" }],
  openGraph: {
    title: "Algorify — Your AI Learning Twin",
    description:
      "The future of personalized education. AI that understands how you learn.",
    type: "website",
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#09090b",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-bg-primary text-text-primary antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

