import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (searchParams.get('type') === 'recovery') {
        return NextResponse.redirect(`${origin}/dashboard/settings/password`);
      }
      
      // If it's a signup confirmation, show the success page
      if (searchParams.get('type') === 'signup' || !searchParams.has('next')) {
        const username =
          data.user?.user_metadata?.username ||
          "Scholar";

        // Sign out after verification so user can login fresh
        await supabase.auth.signOut();

        return NextResponse.redirect(
          `${origin}/auth/confirmed?username=${encodeURIComponent(username)}`
        );
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If verification failed, redirect to the confirmed page gracefully
  return NextResponse.redirect(`${origin}/auth/confirmed?username=Scholar`);
}
