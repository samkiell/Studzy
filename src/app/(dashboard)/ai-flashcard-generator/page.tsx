import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "AI Flashcard Generator – Turn Notes into Flashcards Instantly",
  description:
    "Convert lecture notes, textbooks, and PDFs into study-ready flashcards using AI. Studzy AI extracts key concepts and creates flashcards optimized for active recall and spaced repetition.",
  keywords: [
    "AI flashcard generator",
    "auto generate flashcards",
    "notes to flashcards",
    "AI study cards",
    "spaced repetition AI",
    "university flashcard maker",
  ],
  alternates: { canonical: "/ai-flashcard-generator" },
  openGraph: {
    title: "AI Flashcard Generator – Notes to Flashcards Instantly | Studzy AI",
    description:
      "Upload your notes and let AI create study-ready flashcards. Science-backed learning made easy.",
    url: "https://studzy.me/ai-flashcard-generator",
  },
};

export default function AIFlashcardGeneratorPage() {
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
          Turn Notes into Flashcards Instantly with AI
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-neutral-600 dark:text-neutral-400">
          Stop manually writing flashcards. Studzy AI reads your lecture notes, slides, and textbooks, then automatically generates concise flashcards highlighting the concepts you need to master. Active recall made effortless.
        </p>

        <section className="mt-12">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
            How AI Flashcard Generation Works
          </h2>
          <div className="mt-6 space-y-6">
            <StepBlock step={1} title="Upload Any Study Material" description="PDFs, lecture recordings, slides, or typed notes. Studzy accepts it all and processes it in seconds." />
            <StepBlock step={2} title="AI Extracts Key Concepts" description="Our AI identifies definitions, formulas, dates, processes, and critical facts — everything you need to remember." />
            <StepBlock step={3} title="Review Ready-Made Flashcards" description="Get a full set of flashcards with clear question/answer pairs. Edit, organize, and start studying immediately." />
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
            Why AI Flashcards Beat Manual Creation
          </h2>
          <ul className="mt-4 space-y-3 text-neutral-600 dark:text-neutral-400">
            <li className="flex gap-2"><span className="text-primary-600 font-bold">✓</span> Save hours of manual flashcard writing</li>
            <li className="flex gap-2"><span className="text-primary-600 font-bold">✓</span> AI identifies concepts you might miss</li>
            <li className="flex gap-2"><span className="text-primary-600 font-bold">✓</span> Proven active recall methodology</li>
            <li className="flex gap-2"><span className="text-primary-600 font-bold">✓</span> Works with complex technical subjects</li>
            <li className="flex gap-2"><span className="text-primary-600 font-bold">✓</span> Edit and customize any generated card</li>
          </ul>
        </section>

        <div className="mt-12 rounded-xl border border-neutral-200 bg-primary-50 p-8 text-center dark:border-neutral-800 dark:bg-primary-950/20">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
            Create flashcards in seconds
          </h2>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">
            Upload your first set of notes and watch AI create your flashcards instantly.
          </p>
          <div className="mt-6">
            <Link href="/signup">
              <Button size="lg">Start Free →</Button>
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
