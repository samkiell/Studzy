require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

async function checkBookmarks() {
  const { data, error, count } = await supabase
    .from("bookmarks")
    .select("*", { count: "exact" });

  console.log("Bookmarks:", data);
  console.log("Count:", count);
  console.log("Error:", error);
}

checkBookmarks();
