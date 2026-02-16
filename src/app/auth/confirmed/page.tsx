import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { CheckCircle2 } from "lucide-react";

export default async function ConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ username?: string }>;
}) {
  const params = await searchParams;
  const username = params?.username || "Scholar";

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 dark:bg-neutral-950">
      <div className="relative w-full max-w-sm">
        {/* Background decorative elements */}
        <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-primary-500/10 blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-purple-500/10 blur-3xl animate-pulse" />

        <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-8 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                <CheckCircle2 className="h-10 w-10 text-green-600 animate-bounce dark:text-green-400" />
              </div>
            </div>

            <Link href="/" className="mb-8 inline-flex items-center gap-2">
              <Image src="/favicon.png" alt="Studzy" width={32} height={32} />
              <span className="text-xl font-bold text-primary-600">Studzy</span>
            </Link>

            <h1 className="mt-4 text-2xl font-bold text-neutral-900 dark:text-white">
              Welcome, {username}
            </h1>
            
            <p className="mt-3 text-neutral-600 dark:text-neutral-400">
              Your email has been verified. E good as you no use fake email. Now you fit get access to all Studzy functionalities, Premium resources and chat with the best AI in town (personally endorsed by Elon himself).
            </p>

            <div className="mt-8">
              <Link href="/login">
                <Button className="w-full h-12 text-lg shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 transition-all duration-300">
                  Jaye lo
                </Button>
              </Link>
            </div>

            <p className="mt-6 text-sm text-neutral-500 dark:text-neutral-500">
              No carry phone enter exam hall, abeg 🤲🏾🙏�
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
