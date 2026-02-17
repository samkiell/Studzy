import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "University Study Tools – AI-Powered Revision Platform",
  description:
    "Studzy AI provides a complete suite of AI-powered study tools for university students: quizzes, flashcards, summaries, exam prediction, and an intelligent study assistant available 24/7.",
  keywords: [
    "university study tools",
    "AI revision tools",
    "student study platform",
    "online study tools",
    "AI learning tools",
    "campus study app",
    "exam revision platform",
  ],
  alternates: { canonical: "/university-study-tools" },
  openGraph: {
    title: "University Study Tools – AI-Powered Revision | Studzy AI",
    description:
      "Complete AI study toolkit: quizzes, flashcards, summaries, exam prediction, and 24/7 AI assistant.",
    url: "https://studzy.me/university-study-tools",
  },
};

export default function UniversityStudyToolsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-neutral-50 dark:from-neutral-950 dark:to-neutral-900">
      <nav className="flex items-center justify-between px-4 py-4 md:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/favicon.png" alt="Studzy AI" width={32} height={32} priority />
          <span className="text-xl font-bold text-primary-600">Studzy</span>
        </Link>
        <Link href="/signup">
          <Button size="sm">Get Started Free</Button>
        </Link>
      </nav>

      <article className="mx-auto max-w-3xl px-4 py-16 md:py-24">
        <h1 className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-white md:text-5xl">
          AI-Powered Study Tools for University Students
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-neutral-600 dark:text-neutral-400">
          Studzy AI brings together every tool you need for effective university revision in one platform. From AI-generated quizzes to intelligent exam prediction, study smarter and achieve better results.
        </p>

        <section className="mt-12">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
            Complete Study Toolkit
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <ToolCard emoji="📝" title="AI Quiz Generator" description="Create practice quizzes from your notes instantly. Multiple question formats to test every angle." href="/ai-quiz-generator" />
            <ToolCard emoji="🃏" title="AI Flashcard Maker" description="Convert lengthy notes into concise flashcards. AI extracts the key concepts for you." href="/ai-flashcard-generator" />
            <ToolCard emoji="🎯" title="Exam Predictor" description="AI analyzes your materials to predict likely exam questions. Study what matters." href="/ai-exam-predictor" />
            <ToolCard emoji="🤖" title="24/7 AI Study Assistant" description="Ask questions about any topic. Get instant, clear explanations tailored to your level." href="/signup" />
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
            How Studzy AI Helps You Study Better
          </h2>
          <ul className="mt-4 space-y-3 text-neutral-600 dark:text-neutral-400">
            <li className="flex gap-2"><span className="text-primary-600 font-bold">✓</span> Upload any format: PDFs, audio, video, slides</li>
            <li className="flex gap-2"><span className="text-primary-600 font-bold">✓</span> AI processes and organizes your materials automatically</li>
            <li className="flex gap-2"><span className="text-primary-600 font-bold">✓</span> Track your progress across all courses</li>
            <li className="flex gap-2"><span className="text-primary-600 font-bold">✓</span> Study anytime, anywhere — fully web-based</li>
            <li className="flex gap-2"><span className="text-primary-600 font-bold">✓</span> Built by students, for students</li>
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
            Built for Every Subject
          </h2>
          <p className="mt-4 text-neutral-600 dark:text-neutral-400">
            Whether you&apos;re studying Computer Science, Medicine, Law, Engineering, Business, or Humanities — Studzy AI adapts to your subject. Upload your specific course content and get tools tailored to your exact syllabus.
          </p>
        </section>

        <div className="mt-12 rounded-xl border border-neutral-200 bg-primary-50 p-8 text-center dark:border-neutral-800 dark:bg-primary-950/20">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
            Start studying smarter today
          </h2>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">
            Free to get started. No credit card required. Join students already using AI to ace their exams.
          </p>
          <div className="mt-6">
            <Link href="/signup">
              <Button size="lg">Create Free Account →</Button>
            </Link>
          </div>
        </div>
      </article>

      <footer className="border-t border-neutral-200 px-4 py-8 text-center text-sm text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
        <Link href="/" className="hover:text-primary-600 transition-colors">← Back to Studzy AI</Link>
      </footer>
    </main>
  );
}

function ToolCard({ emoji, title, description, href }: { emoji: string; title: string; description: string; href: string }) {
  return (
    <Link href={href} className="block rounded-xl border border-neutral-200 bg-white p-5 transition-all hover:border-primary-300 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-primary-700">
      <div className="mb-2 text-2xl" aria-hidden="true">{emoji}</div>
      <h3 className="font-semibold text-neutral-900 dark:text-white">{title}</h3>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{description}</p>
    </Link>
  );
}
