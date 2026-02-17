
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing env vars. Ensure .env.local is loaded or vars are set.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listFiles() {
  console.log("Listing files in RAG bucket...");
  const { data, error } = await supabase.storage.from("RAG").list();
  
  if (error) {
    console.error("Error listing files:", error);
    return;
  }
  
  console.log("Files in RAG bucket:");
  if (data.length === 0) {
    console.log("(No files found)");
  }
  data.forEach((f) => console.log(`- ${f.name} (${(f.metadata.size / 1024).toFixed(2)} KB)`));
}

listFiles();
