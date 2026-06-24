import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://dsgpyqwjqoadaedfxmwz.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzZ3B5cXdqcW9hZGFlZGZ4bXd6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDkzNzA2MCwiZXhwIjoyMDg2NTEzMDYwfQ.u6tNUoCqo9Fcp_8P5h7jKp0gXE3DaplZMsbUNBiyRo8";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
  console.log("Fetching RLS policies for table 'attempts'...");
  const { data, error } = await supabase.rpc("exec_sql", {
    query: "SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check FROM pg_policies WHERE tablename = 'attempts';"
  });

  if (error) {
    // If execute_sql RPC doesn't exist, try getting policies from pg_catalog
    console.error("RPC Error:", error.message);
    
    // Fallback: we can check if we can query via a generic execution if execute_sql exists.
    // Let's print out what we can.
  } else {
    console.log("Policies:", data);
  }
}

check();
