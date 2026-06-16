// READ-ONLY inventory of current DB state. No writes.
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

async function count(table, filter) {
  let q = supabase.from(table).select("*", { count: "exact", head: true });
  if (filter) q = filter(q);
  const { count, error } = await q;
  return error ? `ERR(${error.message})` : count;
}

async function main() {
  console.log("=== COURSES ===");
  const { data: courses, error: cErr } = await supabase
    .from("courses")
    .select("id, code, title, is_cbt, exam_type")
    .order("code");
  if (cErr) console.log("courses error:", cErr.message);
  else {
    for (const c of courses) console.log(`${c.code.padEnd(10)} | cbt=${c.is_cbt} | ${c.title}`);
    console.log(`TOTAL courses: ${courses.length}`);
  }

  console.log("\n=== RESOURCES by type ===");
  for (const t of ["audio", "video", "pdf", "image", "document", "question_bank"]) {
    console.log(`${t.padEnd(14)}: ${await count("resources", (q) => q.eq("type", t))}`);
  }
  console.log(`ALL resources : ${await count("resources")}`);

  console.log("\n=== RESOURCES per course ===");
  const { data: res } = await supabase.from("resources").select("course_id, type");
  const byCourse = {};
  (res || []).forEach((r) => {
    byCourse[r.course_id] = (byCourse[r.course_id] || 0) + 1;
  });
  const codeById = Object.fromEntries((courses || []).map((c) => [c.id, c.code]));
  for (const [cid, n] of Object.entries(byCourse)) {
    console.log(`${(codeById[cid] || cid).padEnd(12)}: ${n} resources`);
  }

  console.log("\n=== QUESTIONS (CBT) ===");
  console.log(`ALL questions : ${await count("questions")}`);
  const { data: qs } = await supabase.from("questions").select("course_code");
  const qByCode = {};
  (qs || []).forEach((q) => (qByCode[q.course_code] = (qByCode[q.course_code] || 0) + 1));
  for (const [code, n] of Object.entries(qByCode)) console.log(`${code.padEnd(12)}: ${n} questions`);

  console.log("\n=== EMBEDDINGS (RAG) ===");
  console.log(`ALL embeddings: ${await count("study_material_embeddings")}`);
  const { data: emb } = await supabase.from("study_material_embeddings").select("course_code");
  const eByCode = {};
  (emb || []).forEach((e) => (eByCode[e.course_code] = (eByCode[e.course_code] || 0) + 1));
  for (const [code, n] of Object.entries(eByCode)) console.log(`${(code || "null").padEnd(12)}: ${n} chunks`);

  console.log("\n=== OTHER TABLES ===");
  for (const t of ["attempts", "attempt_answers", "bookmarks", "discussions", "exam_results"]) {
    console.log(`${t.padEnd(16)}: ${await count(t)}`);
  }
}
main().catch((e) => console.error("FATAL", e));
