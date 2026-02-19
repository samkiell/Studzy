"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getURL } from "@/lib/utils";
import { getEmailTemplate } from "@/lib/email-templates";
import { sendEmail } from "@/lib/email";

export async function login(formData: FormData) {
  const supabase = await createClient();
  const identifier = formData.get("email") as string; // We use 'email' field for both/either
  const password = formData.get("password") as string;

  let loginEmail = identifier;

  // 1. Handle Username Login (if identifier is not an email)
  if (!identifier.includes("@")) {
    const adminClient = createAdminClient();
    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("email")
      .eq("username", identifier)
      .single();

    if (profileError || !profile?.email) {
      return { error: "Username not found. Please check and try again." };
    }
    loginEmail = profile.email;
  }

  // 2. Sign In
  const { error } = await supabase.auth.signInWithPassword({
    email: loginEmail,
    password,
  });

  if (error) {
    if (error.message === "Invalid login credentials") {
      return { error: "Invalid email or password. Please try again." };
    }
    return { error: error.message };
  }

  // 3. Record Login (background, non-blocking)
  try {
     const adminClient = createAdminClient();
     const { data: { user } } = await supabase.auth.getUser();
     if (user) {
        await adminClient
          .from("profiles")
          .update({ last_login: new Date().toISOString() })
          .eq("id", user.id);
     }
  } catch (e) {
    console.error("Failed to record login timestamp:", e);
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const email = formData.get("email") as string;
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!username) {
    return { error: "Username is required" };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${getURL()}auth/confirm`,
      data: {
        username: username,
        full_name: username, // Fallback for various UI parts
        is_verified: false,
      }
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Check if user already exists
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return { error: "An account with this email already exists" };
  }

  // If email confirmation is required, Supabase will send the email automatically
  // (configured via Supabase Dashboard email templates)
  if (data.session === null && data.user) {
    return { success: true, message: "Check your email for a confirmation link" };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function resetPassword(email: string) {
  try {
    const adminClient = createAdminClient();
    
    // 1. Generate the recovery link using admin client
    const { data, error } = await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: `${getURL()}auth/confirm?type=recovery`,
      },
    });

    if (error) {
      if (error.message.includes("User not found")) {
        return { error: "No account found with this email address." };
      }
      return { error: error.message };
    }

    // 2. Format the email using our template
    const resetLink = `${getURL()}auth/confirm?token_hash=${data.properties.hashed_token}&type=recovery`;
    const template = getEmailTemplate('reset', {
      link: resetLink,
    });

    // 3. Send the email manually via SMTP
    const emailResult = await sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
    });

    if (!emailResult.success) {
      console.error("[resetPassword] SMTP Error:", emailResult.error);
      return { error: "Reset link generated, but failed to send email. Please try again." };
    }

    return { success: true, message: "Password reset link sent to your email" };
  } catch (err: any) {
    console.error("[resetPassword] Exception:", err);
    return { error: err.message || "An error occurred during password reset" };
  }
}

export async function resendConfirmation(email: string) {
  // Since we don't have the user's password here, we can't use generateLink(type: 'signup').
  // We will revert to using supabase.auth.resend but with the correct redirectTo.
  // If the user's Supabase SMTP is not working, this will still fail at the Supabase level.
  // ALTERNATIVELY, we could use magiclink or invite, but that might change the flow.
  
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${getURL()}auth/confirm`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true, message: "Confirmation email resent" };
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (password !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true, message: "Password updated successfully" };
}

export async function signout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function recordLogin() {
  const adminClient = createAdminClient();
  const supabase = await createClient(); // Need standard client to get current user
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    await adminClient
      .from("profiles")
      .update({ last_login: new Date().toISOString() })
      .eq("id", user.id);
  }
}
