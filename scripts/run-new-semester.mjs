// Runs new-semester-cleanup.sql as ONE atomic exec_sql call (so the DO block's
// RAISE EXCEPTION rolls the whole thing back if student history would change).
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const envContent = fs.readFileSync(path.join(rootDir, ".env.local"), "utf-8");
const env = {};
envContent.split("\n").forEach((line) => {
  const t = line.trim();
  if (t && !t.startsWith("#")) {
    const i = t.indexOf("=");
    if (i > 0) env[t.substring(0, i)] = t.substring(i + 1);
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const sql = fs.readFileSync(path.join(__dirname, "new-semester-cleanup.sql"), "utf-8");

const { error } = await supabase.rpc("exec_sql", { query: sql });
if (error) {
  console.error("❌ Rolled back — no changes applied:\n  ", error.message);
  process.exit(1);
}
console.log("✅ New-semester reset committed.");
