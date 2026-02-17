import { createClient } from "@supabase/supabase-js";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogActivity() {
  // We need a real user ID or we use the service role if possible,
  // but let's just try to see what error we get even if it's RLS.

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    console.log("No user session found, test might fail with RLS");
  }

  const actionType = "login";
  const resourceId = null;
  const metadata = {};

  const { error } = await supabase.from("user_activity").upsert(
    {
      user_id: "77777777-7777-7777-7777-777777777777", // dummy uuid
      action_type: actionType,
      resource_id: resourceId,
      metadata,
      last_accessed: new Date().toISOString(),
    },
    {
      onConflict: "user_id, action_type, resource_id",
    },
  );

  if (error) {
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
  } else {
    console.log("Upsert successful (might have failed silently if RLS)");
  }
}

testLogActivity();
