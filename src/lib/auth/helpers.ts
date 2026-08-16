import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema/auth";
import { eq } from "drizzle-orm";

/**
 * Get the currently authenticated user from a server context.
 * Replaces `supabase.auth.getUser()` across all server components and API routes.
 *
 * @returns The user row from the `users` table, or null if unauthenticated.
 */
export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  return user ?? null;
}

/**
 * Lightweight variant — returns only the session without a DB query.
 * Use when you just need the user ID or email, not the full profile.
 */
export async function getSession() {
  return auth();
}
