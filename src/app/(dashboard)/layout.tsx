import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema/auth";
import { eq } from "drizzle-orm";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { logActivity } from "@/lib/activity";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.status === "suspended") {
    redirect("/login?error=account_suspended");
  }

  // Activity Tracking & Data Sync
  const lastLogin = user.last_login ? new Date(user.last_login) : (user.last_login_date ? new Date(user.last_login_date) : new Date(0));
  const now = new Date();
  const timeSinceSync = now.getTime() - lastLogin.getTime();
  const today = now.toISOString().split("T")[0];

  if (timeSinceSync > 15 * 60 * 1000) {
    await db
      .update(users)
      .set({
        last_login: now,
        last_login_date: today,
        updated_at: now,
      })
      .where(eq(users.id, user.id));

    if (timeSinceSync > 30 * 60 * 1000) {
      await logActivity("login");
    }
  }

  return (
    <DashboardLayout 
      role={user.role || "student"}
      user={{
        username: user.username || user.name || "Student",
        full_name: (user.full_name || user.name) ?? undefined,
        avatar_url: (user.avatar_url || user.image) ?? undefined,
        email: user.email || "",
      }}
    >
      {children}
    </DashboardLayout>
  );
}
