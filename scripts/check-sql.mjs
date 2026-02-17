import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkVersion() {
  const { data, error } = await supabase.rpc("exec_sql", {
    query: "SHOW server_version;",
  });
  // Note: exec_sql returns void, so we might need a different way or just try catch.
  // Actually run-migration.mjs uses exec_sql which returns void.

  // Let's just try to run a simple version command
  const { error: err } = await supabase.rpc("exec_sql", {
    query: "SELECT version();",
  });

  if (err) {
    console.log("Error or exec_sql not found:", err.message);
  } else {
    console.log("exec_sql is working.");
  }
}

checkVersion();
