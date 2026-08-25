import Link from "next/link";
import Image from "next/image";
import { SignupForm } from "@/components/auth/SignupForm";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Footer } from "@/components/ui/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create your Studzy account to access course materials and AI study tools.",
};

export default async function SignupPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 dark:bg-neutral-950">
      <main className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2">
              <Image src="/favicon.png" alt="Studzy" width={40} height={40} />
              <span className="text-2xl font-bold text-primary-600">Studzy</span>
            </Link>
            <h1 className="mt-6 text-2xl font-semibold text-neutral-900 dark:text-white">
              Create your account
            </h1>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              Start your learning journey today, make you sha no go fail.
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
      <Footer />
    </div>
  );
}
