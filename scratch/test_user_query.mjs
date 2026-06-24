import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://dsgpyqwjqoadaedfxmwz.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzZ3B5cXdqcW9hZGFlZGZ4bXd6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDkzNzA2MCwiZXhwIjoyMDg2NTEzMDYwfQ.u6tNUoCqo9Fcp_8P5h7jKp0gXE3DaplZMsbUNBiyRo8";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  const userId = "adca37c9-3a7c-4b0c-ad60-d931c4b22e63";
  
  // 1. Fetch user email
  const { data: userRecord, error: userError } = await supabase.auth.admin.getUserById(userId);
  if (userError || !userRecord.user) {
    console.error("Failed to get user:", userError?.message);
    return;
  }
  
  const email = userRecord.user.email;
  console.log(`User Email: ${email}`);

  // 2. Generate magiclink token
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: email,
  });

  if (linkError) {
    console.error("Failed to generate link:", linkError.message);
    return;
  }

  // Extract access token or token hash
  const token = linkData.properties.email_otp;
  console.log(`Generated Link token: ${token}`);

  // 3. Log in with OTP
  const userClient = createClient(supabaseUrl, "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzZ3B5cXdqcW9hZGFlZGZ4bXd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MzcwNjAsImV4cCI6MjA4NjUxMzA2MH0.HLmKRifznPRKbtFe5FmkE1eM9hrvL4UTclEMz2rUklw");
  const { data: sessionData, error: authError } = await userClient.auth.verifyOtp({
    email,
    token,
    type: 'magiclink'
  });

  if (authError || !sessionData.session) {
    console.error("Auth verify error:", authError?.message);
    return;
  }

  console.log("Logged in successfully as user:", sessionData.user.id);

  // 4. Run the attempts query
  const attemptId = "ffaa259a-8188-4e33-8201-e653d254d5cc";
  console.log(`Running SELECT query for attempt ${attemptId}...`);
  const { data: attemptData, error: attemptError } = await userClient
    .from("attempts")
    .select("*")
    .eq("id", attemptId)
    .eq("user_id", sessionData.user.id)
    .single();

  if (attemptError) {
    console.error("Select Query failed:", attemptError.message);
  } else {
    console.log("Select Query success! Data:", attemptData);
  }
}

run();
