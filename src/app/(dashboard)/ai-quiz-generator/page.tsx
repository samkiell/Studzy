import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "AI Quiz Generator – Create Smart Quizzes Instantly",
  description:
    "Generate targeted quizzes from your lecture notes, textbooks, and study materials using AI. Studzy AI creates personalized practice questions to help you prepare for university exams.",
  keywords: [
    "AI quiz generator",
    "auto generate quiz from notes",
    "AI practice questions",
    "university quiz maker",
    "exam quiz generator",
    "AI study quiz",
  ],
  alternates: { canonical: "/ai-quiz-generator" },
  openGraph: {
    title: "AI Quiz Generator – Create Smart Quizzes Instantly | Studzy AI",
    description:
      "Upload your notes and let AI generate targeted practice quizzes. Perfect for university exam preparation.",
    url: "https://studzy.me/ai-quiz-generator",
  },
};

export default function AIQuizGeneratorPage() {
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
          AI Quiz Generator for University Students
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-neutral-600 dark:text-neutral-400">
          Stop spending hours creating practice questions manually. Studzy AI analyzes your course materials — lecture notes, textbooks, slides, and PDFs — and generates targeted quizzes in seconds. Focus on learning, not on making tests.
        </p>

        <section className="mt-12">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
            How AI Quiz Generation Works
          </h2>
          <div className="mt-6 space-y-6">
            <StepBlock step={1} title="Upload Your Study Material" description="Drop your lecture notes, slides, textbooks, or any PDF. Studzy AI accepts multiple formats and processes them instantly." />
            <StepBlock step={2} title="AI Analyzes Key Concepts" description="Our AI identifies core topics, definitions, formulas, and important details from your material using advanced natural language understanding." />
            <StepBlock step={3} title="Get Personalized Quizzes" description="Receive a set of tailored questions — multiple choice, short answer, and true/false — that mirror what you'll see in your actual exam." />
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
            Why Students Choose Studzy AI for Quizzes
          </h2>
          <ul className="mt-4 space-y-3 text-neutral-600 dark:text-neutral-400">
            <li className="flex gap-2"><span className="text-primary-600 font-bold">✓</span> Instant generation from any study material</li>
            <li className="flex gap-2"><span className="text-primary-600 font-bold">✓</span> Questions targeted to your exact course content</li>
            <li className="flex gap-2"><span className="text-primary-600 font-bold">✓</span> Multiple question formats for thorough preparation</li>
            <li className="flex gap-2"><span className="text-primary-600 font-bold">✓</span> Identify knowledge gaps before exams</li>
            <li className="flex gap-2"><span className="text-primary-600 font-bold">✓</span> Works with PDFs, audio lectures, and video content</li>
          </ul>
        </section>

        <div className="mt-12 rounded-xl border border-neutral-200 bg-primary-50 p-8 text-center dark:border-neutral-800 dark:bg-primary-950/20">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
            Start generating quizzes now
          </h2>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">
            Sign up free and create your first AI-powered quiz in under a minute.
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

function StepBlock({ step, title, description }: { step: number; title: string; description: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 font-bold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
        {step}
      </div>
      <div>
        <h3 className="font-semibold text-neutral-900 dark:text-white">{title}</h3>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{description}</p>
      </div>
    </div>
  );
}
