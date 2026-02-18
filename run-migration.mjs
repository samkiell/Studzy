import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    "Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in the environment or .env.local",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const STORAGE_BUCKET = "RAG";
const MATERIALS_BUCKET = "studzy-materials";

async function migrate() {
  console.log(
    `[Migration] Starting URL migration from ${STORAGE_BUCKET} to ${MATERIALS_BUCKET}...`,
  );

  // Fetch resources that need update
  const { data: resources, error: fetchError } = await supabase
    .from("resources")
    .select("id, file_url, type")
    .in("type", ["audio", "video", "pdf"])
    .like("file_url", `%/${STORAGE_BUCKET}/%`);

  if (fetchError) {
    console.error("[Migration] Fetch error:", fetchError);
    process.exit(1);
  }

  if (!resources || resources.length === 0) {
    console.log("[Migration] No resources found that need migration.");
    process.exit(0);
  }

  console.log(`[Migration] Found ${resources.length} resources to migrate.`);

  let successCount = 0;
  let failCount = 0;

  for (const resource of resources) {
    const newUrl = resource.file_url.replace(
      `/${STORAGE_BUCKET}/`,
      `/${MATERIALS_BUCKET}/`,
    );

    console.log(
      `[Migration] Updating ${resource.id}: ${resource.file_url} -> ${newUrl}`,
    );

    const { error: updateError } = await supabase
      .from("resources")
      .update({ file_url: newUrl })
      .eq("id", resource.id);

    if (updateError) {
      console.error(
        `[Migration] Failed to update resource ${resource.id}:`,
        updateError.message,
      );
      failCount++;
    } else {
      successCount++;
    }
  }

  console.log(
    `[Migration] Migration complete. Success: ${successCount}, Failed: ${failCount}`,
  );
  process.exit(failCount === 0 ? 0 : 1);
}

migrate();
