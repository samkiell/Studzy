import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Blog – Study Smarter with AI | Studzy AI",
  description:
    "Explore our latest articles on AI-powered learning, study tips, and university exam preparation strategies. Learn how to use Studzy AI to ace your courses.",
  keywords: [
    "AI study blog",
    "university study tips",
    "exam preparation strategies",
    "AI learning guides",
    "Studzy AI blog",
  ],
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Studzy AI Blog – Study Smarter with AI",
    description: "Expert guides and tips on using AI to excel in university.",
    url: "https://studzy.me/blog",
  },
};

const blogPosts = [
  {
    title: "How to Study for University Exams Using AI",
    description: "Discover how to study for exams with AI. This step-by-step guide shows university students how to use AI study assistants like Studzy AI for smarter revision.",
    href: "/blog/how-to-study-for-university-exams-using-ai",
    date: "February 13, 2026",
    readingTime: "5 min read",
    category: "Study Guides",
  },
];

export default function BlogIndexPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-neutral-50 dark:from-neutral-950 dark:to-neutral-900">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-4 py-4 md:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/favicon.png" alt="Studzy AI logo" width={32} height={32} priority />
          <span className="text-xl font-bold text-primary-600">Studzy</span>
        </Link>
        <Link href="/signup">
          <Button size="sm">Get Started Free</Button>
        </Link>
      </nav>

      <section className="mx-auto max-w-4xl px-4 py-16 md:py-24">
        <header className="mb-16 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-white md:text-5xl">
            Studzy <span className="text-primary-600">Blog</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600 dark:text-neutral-400">
            Insights, guides, and tips to help you master your university courses with the power of AI.
          </p>
        </header>

        <div className="grid gap-8">
          {blogPosts.map((post) => (
            <Link 
              key={post.href} 
              href={post.href}
              className="group relative flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-6 transition-all hover:border-primary-300 hover:shadow-xl dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-primary-700 md:p-8"
            >
              <div className="flex items-center gap-3 text-sm">
                <span className="rounded-full bg-primary-100 px-3 py-1 font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                  {post.category}
                </span>
                <span className="text-neutral-500 dark:text-neutral-500">•</span>
                <span className="text-neutral-500 dark:text-neutral-500">{post.date}</span>
                <span className="text-neutral-500 dark:text-neutral-500">•</span>
                <span className="text-neutral-500 dark:text-neutral-500">{post.readingTime}</span>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-neutral-900 transition-colors group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400">
                  {post.title}
                </h2>
                <p className="mt-3 text-neutral-600 dark:text-neutral-400">
                  {post.description}
                </p>
              </div>

              <div className="flex items-center text-sm font-semibold text-primary-600 transition-colors group-hover:text-primary-700 dark:text-primary-400 dark:group-hover:text-primary-300">
                Read article 
                <span className="ml-1 transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Newsletter / CTA */}
      <section className="mx-auto max-w-4xl px-4 py-16">
        <div className="rounded-3xl bg-neutral-900 p-8 text-center dark:bg-neutral-800 md:p-12">
          <h2 className="text-2xl font-bold text-white md:text-3xl">
            Want to study smarter?
          </h2>
          <p className="mt-4 text-neutral-400">
            Join thousands of university students using AI to save time and ace their exams.
          </p>
          <div className="mt-8">
            <Link href="/signup">
              <Button size="lg" className="px-8">
                Start Studying Free →
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-neutral-200 px-4 py-8 text-center text-sm text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
        <Link href="/" className="hover:text-primary-600 transition-colors">← Back to Studzy AI</Link>
      </footer>
    </main>
  );
}
