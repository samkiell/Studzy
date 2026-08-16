import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your profile, theme preferences, and security settings.",
};

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white sm:text-3xl">
          Account Settings
        </h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          Manage your student profile preferences, light/dark themes, and password security.
        </p>
      </div>

      <SettingsForm 
        profile={{
          id: user.id,
          email: user.email,
          username: user.username,
          full_name: user.full_name,
          avatar_url: user.avatar_url || user.image,
          bio: user.bio,
          learning_goal: user.learning_goal,
          role: user.role,
        }} 
        initialStack="Software Engineering"
      />
    </div>
  );
}
