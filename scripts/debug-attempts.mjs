import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://dsgpyqwjqoadaedfxmwz.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzZ3B5cXdqcW9hZGFlZGZ4bXd6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDkzNzA2MCwiZXhwIjoyMDg2NTEzMDYwfQ.u6tNUoCqo9Fcp_8P5h7jKp0gXE3DaplZMsbUNBiyRo8";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAttemptsSchema() {
  console.log("Checking attempts table schema...");
  const { data, error } = await supabase.from("attempts").select("*").limit(1);

  if (error) {
    console.error("Error fetching attempt:", error);
  } else {
    const columns = data[0] ? Object.keys(data[0]) : "No data found";
    console.log("Attempt columns:", columns);

    if (Array.isArray(columns) && !columns.includes("time_limit_seconds")) {
      console.log(
        "CRITICAL: 'time_limit_seconds' is MISSING from the actual table.",
      );
    } else if (Array.isArray(columns)) {
      console.log("SUCCESS: 'time_limit_seconds' is present in the table.");
    }
  }
}

checkAttemptsSchema();
