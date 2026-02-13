import { blogPosts } from "@/lib/blog-data";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import type { Metadata } from "next";

// Define the generic props for a dynamic route segment
type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) return { title: "Post Not Found" };

  return {
    title: `${post.title} | Studzy AI Blog`,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
  };
}

export default async function BlogPostPage({ params }: { params: Params }) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-4 py-4 md:px-8 border-b border-neutral-100 dark:border-neutral-800">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/favicon.png" alt="Studzy AI logo" width={32} height={32} priority />
          <span className="text-xl font-bold text-primary-600">Studzy</span>
        </Link>
        <Link href="/blog">
          <Button variant="ghost" size="sm">Back to Blog</Button>
        </Link>
      </nav>

      <article className="mx-auto max-w-3xl px-4 py-12 md:py-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="mb-8 flex items-center gap-3 text-sm font-medium text-neutral-500">
          <span className="text-primary-600 font-bold">{post.category}</span>
          <span>•</span>
          <span>{post.date}</span>
          <span>•</span>
          <span>{post.readingTime}</span>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white md:text-5xl lg:text-6xl">
          {post.title}
        </h1>
        
        <div 
          className="prose prose-neutral dark:prose-invert mt-12 max-w-none prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-10 prose-p:text-lg prose-p:leading-relaxed prose-strong:text-primary-600 dark:prose-strong:text-primary-400"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <div className="mt-16 border-t border-neutral-100 pt-8 dark:border-neutral-800">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Ready to ace your exams?</h3>
              <p className="text-neutral-600 dark:text-neutral-400">Join students using Studzy AI today.</p>
            </div>
            <Link href="/signup">
              <Button size="lg">Get Started Free →</Button>
            </Link>
          </div>
        </div>
      </article>

      <footer className="border-t border-neutral-200 px-4 py-8 text-center text-sm text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
        <Link href="/blog" className="hover:text-primary-600 transition-colors">← Back to all articles</Link>
      </footer>
    </main>
  );
}

// Generate static params for faster loading and better SEO
export async function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}
