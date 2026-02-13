import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-neutral-50 dark:from-neutral-950 dark:to-neutral-900">
      <nav className="flex items-center justify-between px-4 py-4 md:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/favicon.png" alt="Studzy" width={32} height={32} />
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

      <section className="mx-auto max-w-4xl px-4 py-16 text-center md:py-24">
        <h1 className="text-balance text-4xl font-bold tracking-tight text-neutral-900 dark:text-white md:text-6xl">
          Study smarter,
          <br />
          <span className="text-primary-600">not harder</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-600 dark:text-neutral-400">
          Your modern study companion. Organize notes, track progress, and achieve your learning goals.
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

      <section className="mx-auto max-w-5xl px-4 py-16">
        <div className="grid gap-8 md:grid-cols-3">
          <FeatureCard
            title="Organized Notes"
            description="Keep all your study materials in one place, perfectly organized."
          />
          <FeatureCard
            title="Track Progress"
            description="Monitor your learning journey with intuitive progress tracking."
          />
          <FeatureCard
            title="Stay Focused"
            description="Built-in tools to help you maintain focus and productivity."
          />
        </div>
      </section>

      <footer className="border-t border-neutral-200 px-4 py-8 text-center text-sm text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
        © {new Date().getFullYear()} Studzy. All rights reserved.
      </footer>
    </main>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
      <h3 className="font-semibold text-neutral-900 dark:text-white">{title}</h3>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">{description}</p>
    </div>
  );
}
