import { NextRequest, NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import { db } from "@/lib/db";
import { users, verificationTokens } from "@/lib/db/schema/auth";
import { eq, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;

  if (!token) {
    return NextResponse.redirect(`${siteUrl}/forgot-password?error=missing_token`);
  }

  // 1. Verify token in verificationTokens table
  const whereClause = email 
    ? and(eq(verificationTokens.token, token), eq(verificationTokens.identifier, email.toLowerCase().trim()))
    : eq(verificationTokens.token, token);

  const [record] = await db
    .select()
    .from(verificationTokens)
    .where(whereClause)
    .limit(1);

  if (!record || !record.identifier) {
    return NextResponse.redirect(`${siteUrl}/forgot-password?error=invalid_token`);
  }

  if (new Date(record.expires) < new Date()) {
    // Delete expired token
    await db.delete(verificationTokens).where(eq(verificationTokens.token, token));
    return NextResponse.redirect(`${siteUrl}/forgot-password?error=expired_token`);
  }

  // 2. Fetch user
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, record.identifier))
    .limit(1);

  if (!user) {
    return NextResponse.redirect(`${siteUrl}/forgot-password?error=user_not_found`);
  }

  // 3. Delete used verification token
  await db.delete(verificationTokens).where(eq(verificationTokens.token, token));

  // 4. Create NextAuth v5 session JWT
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is missing");
  }

  const isProduction = process.env.NODE_ENV === "production" || siteUrl.startsWith("https://");
  const cookieName = isProduction ? "__Secure-authjs.session-token" : "authjs.session-token";

  const sessionToken = await encode({
    token: {
      id: user.id,
      email: user.email,
      name: user.full_name || user.username || user.name,
      image: user.avatar_url || user.image,
    },
    secret,
    salt: cookieName,
  });

  // 5. Build response and set session cookie
  const redirectUrl = `${siteUrl}/settings?tab=security&recovery=true`;
  const response = NextResponse.redirect(redirectUrl);

  const cookieMaxAge = 30 * 24 * 60 * 60; // 30 days
  response.cookies.set(cookieName, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: isProduction,
    maxAge: cookieMaxAge,
  });

  // Also set un-prefixed fallback in production just in case
  if (isProduction) {
    const fallbackToken = await encode({
      token: {
        id: user.id,
        email: user.email,
        name: user.full_name || user.username || user.name,
        image: user.avatar_url || user.image,
      },
      secret,
      salt: "authjs.session-token",
    });
    response.cookies.set("authjs.session-token", fallbackToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: true,
      maxAge: cookieMaxAge,
    });
  }

  return response;
}
