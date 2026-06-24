import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Footer } from "@/components/ui/Footer";

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 dark:bg-neutral-950">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-6 md:px-12 border-b border-neutral-200/55 dark:border-neutral-800/55">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/favicon.png" alt="Studzy" width={28} height={28} className="rounded-sm" />
          <span className="text-lg font-bold tracking-tight text-neutral-900 dark:text-white">Studzy</span>
        </Link>
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

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 md:py-20">
        <div className="relative mb-12">
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white md:text-5xl">
            Terms of Service
          </h1>
          <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
            Last Updated: June 24, 2026
          </p>
        </div>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-neutral-700 dark:text-neutral-300">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">1. Agreement to Terms</h2>
            <p>
              By accessing or using Studzy (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree to all of these terms, you are prohibited from using the Service and must discontinue use immediately.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">2. Eligibility & Account Responsibilities</h2>
            <p>
              You must register for an account to access key learning resources. You agree to provide accurate and complete registration data. You are solely responsible for protecting your account credentials (including passwords and linked Google authentication tokens) and for all activity occurring under your account.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">3. Acceptable Use Policy</h2>
            <p>
              Studzy is designed to support student learning, revision, and academic growth. You agree to use the Service in compliance with your university’s academic integrity regulations. Specifically:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>You agree not to use the Service or its generated mock test questions to cheat on active, official university assessments.</li>
              <li>You agree not to attempt to disrupt, reverse-engineer, or overload the application infrastructure.</li>
              <li>You agree that you will not abuse or exploit API routes, AI text generation features, or image hosting services.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">4. Intellectual Property</h2>
            <p>
              The materials provided on Studzy—including but not limited to platform software, layouts, course outlines, generated questions, and AI-summarized contents—are protected by copyright and intellectual property laws. Users are granted a limited, personal, non-transferable, and revocable license to access the platform for individual educational use.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">5. Disclaimer of Warranties</h2>
            <p>
              The Service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. We make no warranties, expressed or implied, regarding the accuracy of AI-generated content (including quiz questions, summaries, or exam predictions) or the continuous availability of offline database synchronization.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">6. Limitation of Liability</h2>
            <p>
              In no event shall Studzy or its creators be liable for any damages (including, without limitation, academic penalties, loss of data, or operational interruptions) arising out of the use or inability to use the Service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">7. Governing Law</h2>
            <p>
              These terms shall be governed by and construed in accordance with the laws applicable to Obafemi Awolowo University jurisdictions, without regard to conflict of law principles.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">8. Contact Info</h2>
            <p>
              If you have any questions about these Terms, please contact us at <a href="mailto:studzyai@gmail.com" className="text-primary-600 hover:underline">studzyai@gmail.com</a>.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
