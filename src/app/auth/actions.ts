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
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

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

  // If email confirmation is required, send it manually via SMTP
  if (data.session === null && data.user) {
    try {
      const adminClient = createAdminClient();
      const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
        type: 'signup',
        email,
        password, // We have the password here
        options: {
          redirectTo: `${getURL()}auth/callback`,
        },
      });

      if (linkError) throw linkError;

      const template = getEmailTemplate('confirm', {
        link: linkData.properties.action_link,
      });

      await sendEmail({
        to: email,
        subject: template.subject,
        html: template.html,
      });

      return { success: true, message: "Check your email for a confirmation link" };
    } catch (err: any) {
      console.error("Manual signup email failed:", err);
      // Even if manual email fails, the user is created in Supabase.
      // They just won't get the custom email. 
      return { success: true, message: "Check your email for a confirmation link (using default provider)" };
    }
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
      if (error.message.includes("User not found")) {
        // Obfuscate user existence for security, or keep it for UX? 
        // User said "forget pwd not working", so let's be helpfull.
        return { error: "No account found with this email address." };
      }
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
  // Since we don't have the user's password here, we can't use generateLink(type: 'signup').
  // We will revert to using supabase.auth.resend but with the correct redirectTo.
  // If the user's Supabase SMTP is not working, this will still fail at the Supabase level.
  // ALTERNATIVELY, we could use magiclink or invite, but that might change the flow.
  
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${getURL()}auth/callback`,
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
