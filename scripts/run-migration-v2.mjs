import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const FROM_BUCKET = "studzy-materials";
const TO_BUCKET = "studzy";

async function migrate() {
  console.log(
    `[Migration] Starting URL migration from ${FROM_BUCKET} to ${TO_BUCKET}...`,
  );

  const { data: resources, error: fetchError } = await supabase
    .from("resources")
    .select("id, file_url, type")
    .like("file_url", `%/${FROM_BUCKET}/%`);

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
  for (const resource of resources) {
    const newUrl = resource.file_url.replace(
      `/${FROM_BUCKET}/`,
      `/${TO_BUCKET}/`,
    );
    const { error: updateError } = await supabase
      .from("resources")
      .update({ file_url: newUrl })
      .eq("id", resource.id);

    if (updateError) {
      console.error(`[Migration] Failed ${resource.id}:`, updateError.message);
    } else {
      successCount++;
    }
  }

  console.log(`[Migration] Migration complete. Success: ${successCount}`);
  process.exit(0);
}

migrate();
village;
