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
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 py-1.5 text-xs font-semibold text-primary-600 dark:border-primary-900/30 dark:bg-primary-900/20 dark:text-primary-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-500"></span>
          </span>
          DevCore&apos;23 edition
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-white md:text-6xl">
          Study smarter, <br />
          <span className="text-primary-600">not harder</span>
        </h1>
        <p className="mx-auto mt-6 max-w-lg text-lg text-neutral-500 dark:text-neutral-400">
          Resources your lecturers don&apos;t want you to see, organised and summarised podcast, videos, audios, pdf and more.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link href="/signup">
            <Button size="lg" className="h-12 w-full px-8 text-base font-medium sm:w-auto text-white">
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
            <h3 className="font-semibold text-neutral-900 dark:text-white">Smart AI Assistant</h3>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              A smart AI that can understand texts, images and provide concise summary, flashcards, quizzes and more.
            </p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <h3 className="font-semibold text-neutral-900 dark:text-white">Made for Pioneers</h3>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              Specifically curated for <strong>DevCore&apos;23</strong> Software Engineering Pioneers, OAU.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-neutral-200 py-12 dark:border-neutral-800">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="text-center md:text-left">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                &copy; {new Date().getFullYear()} Studzy. Built for <strong>DevCore&apos;23</strong> Pioneers.
              </p>
            </div>
            
            <div className="flex items-center gap-6">
              <a 
                href="https://www.tiktok.com/@dev.core.23?_r=1&_t=ZS-940LRWiewky" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                title="Follow us on TikTok"
              >
                <span className="text-sm font-medium">TikTok</span>
              </a>
              <a 
                href="https://www.instagram.com/dev.core.23?utm_source=qr" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                title="Follow us on Instagram"
              >
                <span className="text-sm font-medium">Instagram</span>
              </a>
              <a 
                href="mailto:devcore.23.oau@gmail.com"
                className="text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                title="Email us"
              >
                <span className="text-sm font-medium">Email</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
