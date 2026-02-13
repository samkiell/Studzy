import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-neutral-50 dark:bg-neutral-950">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-6 md:px-12">
        <div className="flex items-center gap-2">
          <Image src="/favicon.png" alt="Studzy" width={28} height={28} className="rounded-sm" />
          <span className="text-lg font-bold tracking-tight text-neutral-900 dark:text-white">Studzy</span>
        </div>
        <div className="flex gap-4">
          <Link href="/login">
            <Button variant="ghost" className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white">
              Log in
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200">
              Sign up
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="mx-auto mt-20 max-w-3xl px-6 text-center md:mt-32">
        <h1 className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-white md:text-6xl">
          Software Engineering <br />
          <span className="text-primary-600">University Resources</span>
        </h1>
        <p className="mx-auto mt-6 max-w-lg text-lg text-neutral-500 dark:text-neutral-400">
          Access structured course materials, programming resources, and a focused academic workspace for your degree.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link href="/signup">
            <Button size="lg" className="h-12 w-full px-8 text-base font-medium sm:w-auto">
              Get Started
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg" className="h-12 w-full px-8 text-base font-medium sm:w-auto">
              I Already Have an Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Feature Section */}
      <section className="mx-auto mt-24 max-w-5xl px-6 pb-24 md:mt-32">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <h3 className="font-semibold text-neutral-900 dark:text-white">Organized Course Resources</h3>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              Access lecture notes, slides, and recordings in one structured place.
            </p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <h3 className="font-semibold text-neutral-900 dark:text-white">Structured Study Workflow</h3>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              Follow a clear path through your semester syllabus and materials.
            </p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <h3 className="font-semibold text-neutral-900 dark:text-white">Focused Software Engineering Content</h3>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              Curated specifically for programming and engineering modules.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-neutral-200 py-12 text-center dark:border-neutral-800">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          &copy; 2026 Studzy. Built for Software Engineering Students.
        </p>
      </footer>
    </main>
  );
}
