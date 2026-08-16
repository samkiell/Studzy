import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema/auth";
import { eq } from "drizzle-orm";
import { logActivity } from "@/lib/activity";

export default async function StudzyAILayout({
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

  // Activity Tracking: Update last_login if needed
  const lastLogin = user.last_login_date ? new Date(user.last_login_date) : new Date(0);
  const now = new Date();
  const timeSinceLogin = now.getTime() - lastLogin.getTime();
  
  if (timeSinceLogin > 30 * 60 * 1000) {
    await db
      .update(users)
      .set({ updated_at: now })
      .where(eq(users.id, user.id));
    await logActivity("login");
  }

  return (
    <div className="bg-neutral-50 dark:bg-neutral-950 min-h-screen">
      {children}
    </div>
  );
}
