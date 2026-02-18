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

const MATERIALS_BUCKET = "studzy-materials";
const STORAGE_BUCKET = "RAG";

async function bulkDeletePDF() {
  console.log(`[Bulk Delete] Fetching all PDF resources...`);

  const { data: resources, error: fetchError } = await supabase
    .from("resources")
    .select("id, file_url")
    .eq("type", "pdf");

  if (fetchError) {
    console.error("[Bulk Delete] Fetch error:", fetchError);
    process.exit(1);
  }

  if (!resources || resources.length === 0) {
    console.log("[Bulk Delete] No PDF resources found to delete.");
    process.exit(0);
  }

  console.log(`[Bulk Delete] Found ${resources.length} PDF resources.`);

  let dbDeletedCount = 0;
  let storageDeletedCount = 0;
  let failCount = 0;

  for (const resource of resources) {
    console.log(
      `[Bulk Delete] Processing resource: ${resource.id} (${resource.file_url})`,
    );

    // 1. Extract file path from URL
    try {
      const url = new URL(resource.file_url);
      // Determine bucket from URL
      const bucketInUrl = resource.file_url.includes(`/${MATERIALS_BUCKET}/`)
        ? MATERIALS_BUCKET
        : STORAGE_BUCKET;
      const pathParts = url.pathname.split(
        `/storage/v1/object/public/${bucketInUrl}/`,
      );
      const filePath = pathParts[1];

      if (filePath) {
        console.log(
          `[Bulk Delete] Deleting file from storage: ${bucketInUrl}/${filePath}`,
        );
        const { error: storageError } = await supabase.storage
          .from(bucketInUrl)
          .remove([filePath]);

        if (storageError) {
          console.error(
            `[Bulk Delete] Storage delete error for ${filePath}:`,
            storageError.message,
          );
        } else {
          storageDeletedCount++;
        }
      } else {
        console.warn(
          `[Bulk Delete] Could not parse file path from URL: ${resource.file_url}`,
        );
      }
    } catch (err) {
      console.error(`[Bulk Delete] URL parse error:`, err);
    }

    // 2. Delete from database
    const { error: dbError } = await supabase
      .from("resources")
      .delete()
      .eq("id", resource.id);

    if (dbError) {
      console.error(
        `[Bulk Delete] Database delete error for ${resource.id}:`,
        dbError.message,
      );
      failCount++;
    } else {
      dbDeletedCount++;
    }
  }

  console.log(`[Bulk Delete] Done.`);
  console.log(`- Storage files deleted: ${storageDeletedCount}`);
  console.log(`- Database records deleted: ${dbDeletedCount}`);
  console.log(`- Failures: ${failCount}`);

  process.exit(failCount === 0 ? 0 : 1);
}

bulkDeletePDF();
