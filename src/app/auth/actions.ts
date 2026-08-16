"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, verificationTokens } from "@/lib/db/schema/auth";
import { eq, or, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { AuthError } from "next-auth";
import { sendEmail } from "@/lib/email";
import { getEmailTemplate } from "@/lib/email-templates";

export async function login(formData: FormData) {
  const identifier = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  if (!identifier || !password) {
    return { error: "Please enter your email/username and password." };
  }

  // Pre-check verification status if user exists
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      password_hash: users.password_hash,
      is_verified: users.is_verified,
      emailVerified: users.emailVerified,
    })
    .from(users)
    .where(
      or(
        eq(users.email, identifier.toLowerCase().trim()),
        eq(users.username, identifier.trim())
      )
    )
    .limit(1);

  if (user && user.password_hash) {
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (isMatch && !user.is_verified && !user.emailVerified) {
      return {
        error: "Please verify your email before logging in. Check your inbox for the confirmation link.",
        unverified: true,
        email: user.email,
      };
    }
  }

  try {
    await signIn("credentials", {
      identifier,
      password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid email/username or password." };
        default:
          return { error: "Something went wrong. Please try again." };
      }
    }
    throw error;
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const username = (formData.get("username") as string)?.trim();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!email || !username || !password) {
    return { error: "All fields are required" };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  // Check if email or username is already taken
  const [existingUser] = await db
    .select()
    .from(users)
    .where(or(eq(users.email, email), eq(users.username, username)))
    .limit(1);

  if (existingUser) {
    if (existingUser.email === email) {
      return { error: "An account with this email already exists." };
    }
    if (existingUser.username === username) {
      return { error: "This username is already taken. Please choose another." };
    }
  }

  // Hash password
  const password_hash = await bcrypt.hash(password, 10);

  // Create unverified user in Neon PostgreSQL
  await db.insert(users).values({
    email,
    username,
    full_name: username,
    name: username,
    password_hash,
    role: "student",
    status: "active",
    is_verified: false,
    emailVerified: null,
  });

  // Generate email verification token (valid for 24 hours)
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  // Delete any pre-existing token for this email
  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, email));

  await db.insert(verificationTokens).values({
    identifier: email,
    token,
    expires,
  });

  // Send verification email
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const confirmUrl = `${siteUrl}/auth/confirm?token=${token}&email=${encodeURIComponent(email)}`;
  const template = getEmailTemplate("confirm", { link: confirmUrl, name: username });

  await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
  });

  redirect(`/verify-email?email=${encodeURIComponent(email)}`);
}

export async function resetPassword(email: string) {
  if (!email) {
    return { error: "Email is required" };
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Check if user exists
  const [user] = await db
    .select({ id: users.id, email: users.email, username: users.username })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (!user || !user.email) {
    // For security, do not leak whether email exists
    return { message: "If an account exists with this email, a reset instruction has been sent." };
  }

  // Generate password reset token (valid for 1 hour)
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000);

  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, normalizedEmail));

  await db.insert(verificationTokens).values({
    identifier: normalizedEmail,
    token,
    expires,
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const resetUrl = `${siteUrl}/forgot-password?token=${token}&email=${encodeURIComponent(normalizedEmail)}`;
  const template = getEmailTemplate("reset", { link: resetUrl, name: user.username || "there" });

  await sendEmail({
    to: normalizedEmail,
    subject: template.subject,
    html: template.html,
  });

  return { message: "If an account exists with this email, a reset link will be sent." };
}

export async function updatePassword(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "You must be signed in to update your password." };
  }

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const password_hash = await bcrypt.hash(password, 10);

  await db
    .update(users)
    .set({ password_hash })
    .where(eq(users.id, user.id));

  return { message: "Password updated successfully!" };
}

export async function resendConfirmation(email: string) {
  if (!email) {
    return { error: "Email is required" };
  }

  const normalizedEmail = email.trim().toLowerCase();

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      username: users.username,
      is_verified: users.is_verified,
      emailVerified: users.emailVerified,
    })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (!user || !user.email) {
    return { message: "If your email is registered, a confirmation email has been resent." };
  }

  if (user.is_verified && user.emailVerified) {
    return { message: "Your email is already verified! You can proceed to sign in." };
  }

  // Delete old tokens and generate a fresh one
  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, normalizedEmail));

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await db.insert(verificationTokens).values({
    identifier: normalizedEmail,
    token,
    expires,
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const confirmUrl = `${siteUrl}/auth/confirm?token=${token}&email=${encodeURIComponent(normalizedEmail)}`;
  const template = getEmailTemplate("confirm", { link: confirmUrl, name: user.username || "Scholar" });

  await sendEmail({
    to: normalizedEmail,
    subject: template.subject,
    html: template.html,
  });

  return { message: "Confirmation email sent! Please check your inbox and spam folder." };
}

export async function signout() {
  await signOut({ redirectTo: "/" });
}
