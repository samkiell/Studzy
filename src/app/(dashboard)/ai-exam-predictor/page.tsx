import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "AI Exam Predictor – Predict University Exam Questions",
  description:
    "Studzy AI analyzes your course materials and past papers to predict likely exam questions. Focus your revision on what matters most and walk into exams with confidence.",
  keywords: [
    "AI exam predictor",
    "predict exam questions",
    "AI exam preparation",
    "university exam prediction",
    "exam question generator",
    "smart revision AI",
  ],
  alternates: { canonical: "/ai-exam-predictor" },
  openGraph: {
    title: "AI Exam Predictor – Predict Exam Questions | Studzy AI",
    description:
      "Focus your revision on what matters. AI predicts likely exam questions from your course material.",
    url: "https://studzy.me/ai-exam-predictor",
  },
};

export default function AIExamPredictorPage() {
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
          Predict Exam Questions with AI
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-neutral-600 dark:text-neutral-400">
          Don&apos;t waste time studying everything equally. Studzy AI analyzes your course syllabus, lecture content, and past exam patterns to identify the topics and question styles most likely to appear on your next exam.
        </p>

        <section className="mt-12">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
            How AI Exam Prediction Works
          </h2>
          <div className="mt-6 space-y-6">
            <StepBlock step={1} title="Input Your Course Content" description="Upload syllabi, lecture notes, past papers, and any course materials. The more data, the more accurate the predictions." />
            <StepBlock step={2} title="AI Identifies Patterns" description="Studzy AI detects topic frequency, emphasis patterns, and question structures across your materials to build a prediction model." />
            <StepBlock step={3} title="Get Predicted Questions" description="Receive a prioritized list of predicted exam questions ranked by likelihood. Focus your revision where it counts." />
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
            Study What Matters Most
          </h2>
          <ul className="mt-4 space-y-3 text-neutral-600 dark:text-neutral-400">
            <li className="flex gap-2"><span className="text-primary-600 font-bold">✓</span> Focus revision on high-probability topics</li>
            <li className="flex gap-2"><span className="text-primary-600 font-bold">✓</span> Understand exam question patterns and formats</li>
            <li className="flex gap-2"><span className="text-primary-600 font-bold">✓</span> Reduce exam anxiety with targeted preparation</li>
            <li className="flex gap-2"><span className="text-primary-600 font-bold">✓</span> Works across all university subjects</li>
            <li className="flex gap-2"><span className="text-primary-600 font-bold">✓</span> Continuously improves with more data</li>
          </ul>
        </section>

        <div className="mt-12 rounded-xl border border-neutral-200 bg-primary-50 p-8 text-center dark:border-neutral-800 dark:bg-primary-950/20">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
            Predict your next exam questions
          </h2>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">
            Upload your course materials and let AI tell you what to focus on.
          </p>
          <div className="mt-6">
            <Link href="/signup">
              <Button size="lg">Try Exam Predictor Free →</Button>
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
