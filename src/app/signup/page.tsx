import Link from "next/link";
import Image from "next/image";
import { SignupForm } from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 dark:bg-neutral-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image src="/logo-icon.png" alt="Studzy" width={40} height={40} />
            <span className="text-2xl font-bold text-primary-600">Studzy</span>
          </Link>
          <h1 className="mt-6 text-2xl font-semibold text-neutral-900 dark:text-white">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Start your learning journey today
          </p>
        </div>
        <SignupForm />
        <p className="mt-6 text-center text-sm text-neutral-600 dark:text-neutral-400">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary-600 hover:text-primary-500">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
