import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (searchParams.get('type') === 'recovery') {
        return NextResponse.redirect(`${origin}/dashboard/settings/password`);
      }
      
      // If it's a signup confirmation, show the success page
      if (searchParams.get('type') === 'signup' || !searchParams.has('next')) {
        return NextResponse.redirect(`${origin}/auth/confirm`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // URL to redirect to after sign up process completes
  const errorUrl = new URL(`${origin}/auth/auth-code-error`);
  const type = searchParams.get('type');
  if (type) {
    errorUrl.searchParams.set('type', type);
  }

  return NextResponse.redirect(errorUrl.toString());
}
