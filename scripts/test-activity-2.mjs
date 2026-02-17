import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const userId = "b4f9f21d-4886-4acc-b14e-09a246830e27"; // Use a random but valid-ish UUID

  console.log("Testing upsert with NULL resource_id...");
  const { error: error1 } = await supabase.from("user_activity").upsert(
    {
      user_id: userId,
      action_type: "login",
      resource_id: null,
      last_accessed: new Date().toISOString(),
    },
    {
      onConflict: "user_id, action_type, resource_id",
    },
  );

  if (error1) {
    console.log("Error 1 (First attempt):", error1.message, error1.code);
  } else {
    console.log("Success 1 (First attempt)");
  }

  console.log(
    "Testing upsert with NULL resource_id AGAIN (should trigger conflict)...",
  );
  const { error: error2 } = await supabase.from("user_activity").upsert(
    {
      user_id: userId,
      action_type: "login",
      resource_id: null,
      last_accessed: new Date().toISOString(),
    },
    {
      onConflict: "user_id, action_type, resource_id",
    },
  );

  if (error2) {
    console.log(
      "Error 2 (Second attempt):",
      error2.message,
      error2.code,
      error2.details,
    );
  } else {
    console.log("Success 2 (Second attempt)");
  }
}

test();
