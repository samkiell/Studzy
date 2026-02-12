import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-white md:text-3xl">
        Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}
      </h1>
      <p className="mt-2 text-neutral-600 dark:text-neutral-400">
        Here&apos;s an overview of your study progress.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Study Sessions" value="0" />
        <StatCard title="Notes Created" value="0" />
        <StatCard title="Hours Studied" value="0" />
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
          Recent Activity
        </h2>
        <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-8 text-center dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-neutral-500 dark:text-neutral-400">
            No recent activity. Start studying to see your progress!
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
      <p className="text-sm text-neutral-600 dark:text-neutral-400">{title}</p>
      <p className="mt-1 text-3xl font-bold text-neutral-900 dark:text-white">{value}</p>
    </div>
  );
}
