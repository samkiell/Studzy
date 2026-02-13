import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile as Profile | null;
}

export async function isAdmin(): Promise<boolean> {
  const profile = await getProfile();
  return profile?.role === "admin";
}

export async function requireAdmin(): Promise<Profile> {
  const profile = await getProfile();

  if (!profile) {
    throw new Error("Not authenticated");
  }

  if (profile.role !== "admin") {
    throw new Error("Not authorized - Admin access required");
  }

  return profile;
}
