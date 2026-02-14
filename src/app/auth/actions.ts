"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getURL } from "@/lib/utils";
import { sendEmail } from "@/lib/email";
import { getEmailTemplate } from "@/lib/email-templates";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (password !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${getURL()}auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Check if user already exists
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return { error: "An account with this email already exists" };
  }

  // If email confirmation is required
  if (data.session === null) {
    return { success: true, message: "Check your email for a confirmation link" };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function resetPassword(email: string) {
  try {
    const adminClient = createAdminClient();
    
    // Generate the recovery link
    const { data, error } = await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: `${getURL()}auth/callback?type=recovery`,
      },
    });

    if (error) {
      return { error: error.message };
    }

    // Send the email manually via SMTP
    const template = getEmailTemplate('reset', {
      link: data.properties.action_link,
    });

    const emailResult = await sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
    });

    if (!emailResult.success) {
      return { error: "Failed to send reset email. Please try again later." };
    }

    return { success: true, message: "Password reset link sent to your email" };
  } catch (err: any) {
    return { error: err.message || "An error occurred during password reset" };
  }
}

export async function resendConfirmation(email: string) {
  try {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient.auth.admin.generateLink({
      type: 'signup',
      email,
      options: {
        redirectTo: `${getURL()}auth/callback`,
      },
    });

    if (error) {
      return { error: error.message };
    }

    const template = getEmailTemplate('confirm', {
      link: data.properties.action_link,
    });

    const emailResult = await sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
    });

    if (!emailResult.success) {
      return { error: "Failed to resend confirmation email." };
    }

    return { success: true, message: "Confirmation email resent" };
  } catch (err: any) {
    return { error: err.message || "Failed to resend confirmation" };
  }
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
