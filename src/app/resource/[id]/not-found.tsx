import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function ResourceNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
        <svg
          className="h-10 w-10 text-neutral-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <h2 className="mt-6 text-2xl font-bold text-neutral-900 dark:text-white">
        Resource not found
      </h2>
      <p className="mt-2 max-w-md text-neutral-600 dark:text-neutral-400">
        The resource you&apos;re looking for doesn&apos;t exist or may have been removed.
      </p>
      <Link href="/dashboard" className="mt-8">
        <Button>Back to Dashboard</Button>
      </Link>
    </div>
  );
}
