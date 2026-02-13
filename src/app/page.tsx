import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-neutral-50 dark:from-neutral-950 dark:to-neutral-900">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-4 py-4 md:px-8" aria-label="Main navigation">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/favicon.png" alt="Studzy AI logo" width={32} height={32} priority />
          <span className="text-xl font-bold text-primary-600">Studzy</span>
        </Link>
        <div className="flex gap-2">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Log in
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">Sign up</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="mx-auto max-w-4xl px-4 py-16 text-center md:py-24">
        <h1 className="text-balance text-4xl font-bold tracking-tight text-neutral-900 dark:text-white md:text-6xl">
          AI Study Assistant for{" "}
          <span className="text-primary-600">University Students</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-600 dark:text-neutral-400">
          Generate quizzes, flashcards, summaries, and exam predictions instantly with AI.
          Study smarter, ace your exams, and take control of your academic success.
        </p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link href="/signup">
            <Button size="lg" className="w-full sm:w-auto">
              Get started free
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              I already have an account
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="mx-auto max-w-5xl px-4 py-16" aria-label="Features">
        <div className="grid gap-8 md:grid-cols-2">
          <FeatureCard
            title="Generate Smart Quizzes with AI"
            description="Upload your notes or textbooks and let Studzy AI instantly create targeted quizzes that test your understanding. Practice with questions tailored to your exact course material."
            icon="📝"
          />
          <FeatureCard
            title="Turn Notes into Flashcards Instantly"
            description="Transform lengthy notes, slides, and PDFs into concise, study-ready flashcards. AI-powered extraction highlights the key concepts you need to remember."
            icon="🃏"
          />
          <FeatureCard
            title="Predict Exam Questions with AI"
            description="Studzy AI analyzes your course material and past papers to predict likely exam questions. Focus your revision on what matters most."
            icon="🎯"
          />
          <FeatureCard
            title="AI-Powered Revision Tools"
            description="Get instant explanations, summaries, and study plans. Ask Studzy AI anything about your courses and receive clear, accurate answers in seconds."
            icon="🚀"
          />
        </div>
      </section>

      {/* How It Works Section */}
      <section className="border-t border-neutral-200 dark:border-neutral-800">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <h2 className="text-3xl font-bold text-neutral-900 dark:text-white md:text-4xl">
            How Studzy AI Works
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-neutral-600 dark:text-neutral-400">
            Three simple steps to transform your study experience.
          </p>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <StepCard step={1} title="Upload Your Materials" description="Add your lecture notes, textbooks, slides, or any study material in PDF, audio, or video format." />
            <StepCard step={2} title="AI Processes & Learns" description="Studzy AI analyzes your content, identifies key topics, and prepares personalized study tools." />
            <StepCard step={3} title="Study Smarter" description="Access AI-generated quizzes, flashcards, summaries, and ask questions anytime to deepen your understanding." />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-neutral-200 dark:border-neutral-800">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h2 className="text-3xl font-bold text-neutral-900 dark:text-white">
            Ready to ace your exams?
          </h2>
          <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400">
            Join thousands of university students using AI to study smarter. Free to get started.
          </p>
          <div className="mt-8">
            <Link href="/signup">
              <Button size="lg">Start studying with AI →</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200 px-4 py-8 dark:border-neutral-800">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 text-sm text-neutral-500 dark:text-neutral-400 md:flex-row">
          <p>© {new Date().getFullYear()} Studzy AI. All rights reserved.</p>
          <nav className="flex gap-6" aria-label="Footer navigation">
            <Link href="/ai-quiz-generator" className="hover:text-primary-600 transition-colors">AI Quiz Generator</Link>
            <Link href="/ai-flashcard-generator" className="hover:text-primary-600 transition-colors">AI Flashcards</Link>
            <Link href="/ai-exam-predictor" className="hover:text-primary-600 transition-colors">Exam Predictor</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <article className="rounded-xl border border-neutral-200 bg-white p-6 transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-3 text-3xl" aria-hidden="true">{icon}</div>
      <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">{description}</p>
    </article>
  );
}

function StepCard({ step, title, description }: { step: number; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-lg font-bold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
        {step}
      </div>
      <h3 className="font-semibold text-neutral-900 dark:text-white">{title}</h3>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">{description}</p>
    </div>
  );
}
