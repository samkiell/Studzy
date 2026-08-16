"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema/auth";
import { eq, or } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";

export async function login(formData: FormData) {
  const identifier = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  if (!identifier || !password) {
    return { error: "Please enter your email/username and password." };
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

  // Create new user in Neon PostgreSQL
  await db.insert(users).values({
    email,
    username,
    full_name: username,
    name: username,
    password_hash,
    role: "student",
    status: "active",
    is_verified: false,
    emailVerified: new Date(),
  });

  // Sign in automatically
  try {
    await signIn("credentials", {
      identifier: email,
      password,
      redirect: false,
    });
  } catch (error) {
    // If signin throws redirect, allow it
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signout() {
  await signOut({ redirectTo: "/" });
}
