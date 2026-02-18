"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin";
import { STORAGE_BUCKET, MATERIALS_BUCKET } from "@/lib/rag/config";

/**
 * Migration script to update existing resource URLs from the RAG bucket to the studzy-materials bucket.
 * This only affects audio, video, and pdf types.
 */
export async function migrateResourceUrls() {
  try {
    await requireAdmin();
    const supabase = await createClient();

    console.log(`[Migration] Starting URL migration from ${STORAGE_BUCKET} to ${MATERIALS_BUCKET}...`);

    // Fetch resources that need update
    const { data: resources, error: fetchError } = await supabase
      .from("resources")
      .select("id, file_url, type")
      .in("type", ["audio", "video", "pdf"])
      .like("file_url", `%/${STORAGE_BUCKET}/%`);

    if (fetchError) {
      throw fetchError;
    }

    if (!resources || resources.length === 0) {
      return { success: true, message: "No resources found that need migration.", count: 0 };
    }

    console.log(`[Migration] Found ${resources.length} resources to migrate.`);

    let successCount = 0;
    let failCount = 0;

    for (const resource of resources) {
      const newUrl = resource.file_url.replace(`/${STORAGE_BUCKET}/`, `/${MATERIALS_BUCKET}/`);
      
      const { error: updateError } = await supabase
        .from("resources")
        .update({ file_url: newUrl })
        .eq("id", resource.id);

      if (updateError) {
        console.error(`[Migration] Failed to update resource ${resource.id}:`, updateError.message);
        failCount++;
      } else {
        successCount++;
      }
    }

    console.log(`[Migration] Migration complete. Success: ${successCount}, Failed: ${failCount}`);

    return {
      success: true,
      message: `Migration complete. Successfully updated ${successCount} URLs. Fails: ${failCount}`,
      count: successCount
    };
  } catch (error: any) {
    console.error("[Migration] Error:", error);
    return { success: false, message: error.message || "Migration failed" };
  }
}
