import { getCurrentUser } from "@/lib/auth";

export async function getProfile() {
  return getCurrentUser();
}

export async function isAdmin(): Promise<boolean> {
  const profile = await getProfile();
  return profile?.role === "admin";
}

export async function requireAdmin() {
  const profile = await getProfile();

  if (!profile) {
    throw new Error("Not authenticated");
  }

  if (profile.role !== "admin") {
    throw new Error("Not authorized - Admin access required");
  }

  return profile;
}
