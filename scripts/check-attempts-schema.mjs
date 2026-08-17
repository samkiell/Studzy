import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAttemptsSchema() {
  const { data, error } = await supabase.from("attempts").select("*").limit(1);

  if (error) {
    console.error("Error fetching attempt:", error);
  } else {
    console.log("Attempt columns:", Object.keys(data[0] || {}));
    console.log("Full attempt sample:", data[0]);
  }
}

checkAttemptsSchema();
