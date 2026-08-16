import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, verificationTokens, profiles } from "@/lib/db/schema/auth";
import { eq, and, gt } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  if (!token || !email) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Find valid, non-expired verification token
  const [vt] = await db
    .select()
    .from(verificationTokens)
    .where(
      and(
        eq(verificationTokens.identifier, normalizedEmail),
        eq(verificationTokens.token, token),
        gt(verificationTokens.expires, new Date())
      )
    )
    .limit(1);

  if (!vt) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  // Delete the used token
  await db
    .delete(verificationTokens)
    .where(
      and(
        eq(verificationTokens.identifier, vt.identifier),
        eq(verificationTokens.token, vt.token)
      )
    );

  // Update user as verified in Neon PostgreSQL
  const [updatedUser] = await db
    .update(users)
    .set({
      is_verified: true,
      emailVerified: new Date(),
    })
    .where(eq(users.email, normalizedEmail))
    .returning({ username: users.username, fullName: users.full_name, name: users.name });

  // Also update legacy profiles table if it exists
  try {
    await db
      .update(profiles)
      .set({
        is_verified: true,
        email_confirmed_at: new Date(),
      })
      .where(eq(profiles.email, normalizedEmail));
  } catch (e) {
    // profiles table might be ignored or empty
  }

  const displayName = updatedUser?.username || updatedUser?.fullName || updatedUser?.name || "Scholar";
  return NextResponse.redirect(`${origin}/auth/confirmed?username=${encodeURIComponent(displayName)}`);
}
