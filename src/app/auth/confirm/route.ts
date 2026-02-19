import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as
    | "signup"
    | "email"
    | "recovery"
    | "invite"
    | "magiclink"
    | null;
  const code = searchParams.get("code");

  const supabase = await createClient();

  // Handle token_hash-based confirmation (Supabase default email links)
  if (token_hash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error && data.user) {
      const username =
        data.user.user_metadata?.username ||
        "Scholar";

      // Sync confirmation to profiles table
      const { error: syncError } = await supabase
        .from("profiles")
        .update({ email_confirmed_at: new Date().toISOString() })
        .eq("id", data.user.id);

      if (syncError) {
        console.error("Failed to sync email confirmation:", syncError.message);
      }

      if (type === "recovery") {
        return NextResponse.redirect(
          `${origin}/dashboard/settings/password`
        );
      }

      // Sign out after verification so user can login fresh
      await supabase.auth.signOut();

      return NextResponse.redirect(
        `${origin}/auth/confirmed?username=${encodeURIComponent(username)}`
      );
    }

    // If token verification failed, still redirect gracefully
    console.error("Token verification failed:", error?.message);
    return NextResponse.redirect(
      `${origin}/auth/confirmed?username=Scholar`
    );
  }

  // Handle code-based confirmation (PKCE flow)
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const username =
        data.user.user_metadata?.username ||
        "Scholar";

      // Sync confirmation to profiles table
      const { error: syncError } = await supabase
        .from("profiles")
        .update({ email_confirmed_at: new Date().toISOString() })
        .eq("id", data.user.id);

      if (syncError) {
        console.error("Failed to sync email confirmation:", syncError.message);
      }

      if (searchParams.get("type") === "recovery") {
        return NextResponse.redirect(
          `${origin}/dashboard/settings/password`
        );
      }

      // Sign out after verification so user can login fresh
      await supabase.auth.signOut();

      return NextResponse.redirect(
        `${origin}/auth/confirmed?username=${encodeURIComponent(username)}`
      );
    }

    console.error("Code exchange failed:", error?.message);
    return NextResponse.redirect(
      `${origin}/auth/confirmed?username=Scholar`
    );
  }

  // No token_hash or code — redirect to login
  return NextResponse.redirect(`${origin}/login`);
}
