import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://dsgpyqwjqoadaedfxmwz.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzZ3B5cXdqcW9hZGFlZGZ4bXd6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDkzNzA2MCwiZXhwIjoyMDg2NTEzMDYwfQ.u6tNUoCqo9Fcp_8P5h7jKp0gXE3DaplZMsbUNBiyRo8";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  console.log("Creating exec_query_text helper function in database...");
  const createFuncSql = `
    CREATE OR REPLACE FUNCTION public.exec_query_text(query text)
    RETURNS text LANGUAGE plpgsql SECURITY DEFINER
    AS $$
    DECLARE
        result text;
    BEGIN
        EXECUTE query INTO result;
        RETURN result;
    END;
    $$;
  `;

  const { error: createError } = await supabase.rpc("exec_sql", {
    query: createFuncSql,
  });

  if (createError) {
    console.error("Failed to create helper function:", createError.message);
    return;
  }

  console.log("Helper function created successfully!");

  console.log("Reloading schema cache...");
  await supabase.rpc("exec_sql", { query: "NOTIFY pgrst, 'reload schema';" });
  await new Promise(resolve => setTimeout(resolve, 1500)); // wait 1.5 seconds for cache reload

  // Query RLS status of attempts table
  console.log("\n1. Querying RLS status of 'attempts' table...");
  const { data: rlsStatus, error: rlsError } = await supabase.rpc("exec_query_text", {
    query: "SELECT relrowsecurity::text FROM pg_class WHERE relname = 'attempts';"
  });

  if (rlsError) {
    console.error("Error querying RLS status:", rlsError.message);
  } else {
    console.log("RLS Enabled (t = true, f = false):", rlsStatus);
  }

  // Query policies of attempts table
  console.log("\n2. Querying RLS policies for 'attempts' table...");
  const { data: policiesJson, error: policiesError } = await supabase.rpc("exec_query_text", {
    query: "SELECT COALESCE(array_to_json(array_agg(row_to_json(p)))::text, '[]') FROM (SELECT policyname, roles, cmd, qual FROM pg_policies WHERE tablename = 'attempts') p;"
  });

  if (policiesError) {
    console.error("Error querying policies:", policiesError.message);
  } else {
    console.log("Policies:", JSON.stringify(JSON.parse(policiesJson), null, 2));
  }
}

run();
