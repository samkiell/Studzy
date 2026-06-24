import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://dsgpyqwjqoadaedfxmwz.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzZ3B5cXdqcW9hZGFlZGZ4bXd6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDkzNzA2MCwiZXhwIjoyMDg2NTEzMDYwfQ.u6tNUoCqo9Fcp_8P5h7jKp0gXE3DaplZMsbUNBiyRo8";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
  const attemptId = "ffaa259a-8188-4e33-8201-e653d254d5cc";
  console.log(`Checking 'attempts' table for ID ${attemptId}...`);
  const { data: attempt, error: attemptErr } = await supabase
    .from("attempts")
    .select("*")
    .eq("id", attemptId)
    .single();

  if (attemptErr) {
    console.error("attempts error:", attemptErr.message);
  } else {
    console.log("Found in attempts:", attempt);
  }

  console.log(`Checking 'theory_attempts' table for ID ${attemptId}...`);
  const { data: theoryAttempt, error: theoryErr } = await supabase
    .from("theory_attempts")
    .select("*")
    .eq("id", attemptId)
    .single();

  if (theoryErr) {
    console.error("theory_attempts error:", theoryErr.message);
  } else {
    console.log("Found in theory_attempts:", theoryAttempt);
  }
}

check();
