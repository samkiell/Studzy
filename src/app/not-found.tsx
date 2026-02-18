import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { BookOpen, Search } from "lucide-react";

import { Footer } from "@/components/ui/Footer";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 dark:bg-neutral-950">
      <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <div className="relative">
          <h1 className="text-[150px] font-bold leading-none text-neutral-200 dark:text-neutral-800 md:text-[200px]">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <BookOpen className="h-16 w-16 text-primary-500" />
          </div>
        </div>
        
        <h2 className="mt-4 text-2xl font-bold text-neutral-900 dark:text-white md:text-3xl">
          Oops! This page is studying abroad
        </h2>
        
        <p className="mt-3 max-w-md text-neutral-600 dark:text-neutral-400">
          Looks like this page pulled an all-nighter and forgot to come back. 
          It&apos;s probably still at the library... or maybe it dropped out.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/">
            <Button size="lg">Take me home</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" size="lg">Back to studying</Button>
          </Link>
        </div>

        <div className="mt-12 rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            <span className="font-medium">Pro tip:</span> Unlike this page, your grades won&apos;t disappear if you keep studying! 
          </p>
        </div>

        <p className="mt-8 text-xs text-neutral-400 dark:text-neutral-600">
          Error 404 • Page not found • Maybe try the search bar next time? <Search className="inline h-3 w-3" />
        </p>
      </main>
      <Footer />
    </div>
  );
}
