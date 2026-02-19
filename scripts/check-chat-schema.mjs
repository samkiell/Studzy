import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .limit(1);

  if (error) {
    console.error("Error fetching chat_messages:", error);
    return;
  }

  if (data && data.length > 0) {
    console.log("Columns in chat_messages:", Object.keys(data[0]));
  } else {
    console.log(
      "No messages found, checking table info via RPC or other means if needed.",
    );
    // Fallback: search for any message in any session
    const { data: allData } = await supabase
      .from("chat_messages")
      .select("*")
      .limit(1);
    if (allData && allData.length > 0) {
      console.log(
        "Columns in chat_messages (global):",
        Object.keys(allData[0]),
      );
    }
  }
}

checkSchema();
