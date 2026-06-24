import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Footer } from "@/components/ui/Footer";

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
            Last Updated: June 24, 2026
          </p>
        </div>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-neutral-700 dark:text-neutral-300">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">1. Introduction</h2>
            <p>
              Welcome to Studzy (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains what information we collect, how we use it, and what rights you have in relation to it.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">2. Information We Collect</h2>
            <p>
              We collect information that you directly provide to us, including:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Account Information:</strong> When you sign up, we collect your email address, username, and authentication details (including OAuth profile information such as Google avatars and names).</li>
              <li><strong>Academic Data:</strong> Details of your courses, quiz attempts, study statistics, and interactions with AI learning features.</li>
              <li><strong>Activity Logs:</strong> System logs tracking your usage analytics, login timestamps, page view records, and learning milestones.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">3. How We Use Your Information</h2>
            <p>
              We process your information to deliver, improve, and secure our services, specifically:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>To create and manage your student profile and enable authentication.</li>
              <li>To synchronize offline computer-based test (CBT) attempts and grade results.</li>
              <li>To customize AI-driven study tools (like quiz and flashcard generation).</li>
              <li>To provide system notifications and emails related to your account.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">4. Data Storage and Security</h2>
            <p>
              Your data is stored securely using industry-standard measures provided by our database infrastructure. For offline usage, we leverage browser-based IndexedDB storage to hold questions and local mock attempts, which synchronize to our servers once an internet connection is established.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">5. Third-Party Services</h2>
            <p>
              We may utilize third-party services such as Supabase for backend infrastructure/database management, Vercel Analytics for usage insights, and Cloudinary for file uploads. These services process data in accordance with their respective privacy policies.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">6. Your Rights</h2>
            <p>
              Depending on your location, you may have rights to access, modify, or request deletion of your personal data. You can manage your profile settings or delete your account through your profile dashboard.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">7. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. The updated version will be indicated by an updated date at the top of the policy page.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">8. Contact Us</h2>
            <p>
              If you have questions or comments about this policy, please contact us at <a href="mailto:studzyai@gmail.com" className="text-primary-600 hover:underline">studzyai@gmail.com</a>.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
