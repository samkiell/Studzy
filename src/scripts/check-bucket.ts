
import { createAdminClient } from "../lib/supabase/admin";

async function listFiles() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage.from("RAG").list();
  
  if (error) {
    console.error("Error listing files:", error);
    return;
  }
  
  console.log("Files in RAG bucket:");
  data.forEach((f) => console.log(`- ${f.name} (${(f.metadata.size / 1024).toFixed(2)} KB)`));
}

listFiles();
