import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your profile, theme preferences, and security settings.",
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user profile info
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    console.error("Failed to load user profile in settings:", error);
    throw new Error("Could not load settings data");
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
        profile={profile} 
        initialStack={user.user_metadata?.stack || "Frontend Dev"}
      />
    </div>
  );
}
