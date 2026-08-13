import { createAdminClient } from "@/lib/supabase/admin";
import { StorageFileDetail, LinkedApplicationResource, FileTypeCategoryUsage } from "./types";
import { logGuardrailEvent } from "./logger";

function categorizeFileType(name: string, mimeType?: string): FileTypeCategoryUsage["category"] {
  const lowerName = name.toLowerCase();
  const ext = lowerName.split(".").pop() || "";
  const lowerMime = (mimeType || "").toLowerCase();

  if (lowerMime.startsWith("video/") || ["mp4", "webm", "mkv", "mov", "avi"].includes(ext)) {
    return "video";
  }
  if (lowerMime.startsWith("audio/") || ["mp3", "wav", "ogg", "m4a", "aac", "flac"].includes(ext)) {
    return "audio";
  }
  if (lowerMime === "application/pdf" || ext === "pdf") {
    return "pdf";
  }
  if (lowerMime.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) {
    return "image";
  }
  if (
    lowerMime.startsWith("text/") || 
    lowerMime.includes("json") || 
    lowerMime.includes("javascript") ||
    ["txt", "doc", "docx", "md", "csv", "json", "js", "ts", "py"].includes(ext)
  ) {
    return "document";
  }
  return "other";
}

interface RawFileObject {
  id?: string | null;
  name: string;
  bucket: string;
  path: string;
  metadata?: {
    size?: number;
    mimetype?: string;
  } | null;
  created_at?: string;
}

async function listBucketObjectsRecursive(
  supabase: ReturnType<typeof createAdminClient>,
  bucketId: string,
  folderPath: string = ""
): Promise<RawFileObject[]> {
  let fileList: RawFileObject[] = [];
  const { data, error } = await supabase.storage.from(bucketId).list(folderPath, { limit: 1000 });
  if (error || !data) return fileList;

  for (const item of data) {
    const fullPath = folderPath ? `${folderPath}/${item.name}` : item.name;
    if (!item.metadata || !item.id) {
      const subFiles = await listBucketObjectsRecursive(supabase, bucketId, fullPath);
      fileList = fileList.concat(subFiles);
    } else {
      fileList.push({
        id: item.id,
        name: item.name,
        bucket: bucketId,
        path: fullPath,
        metadata: item.metadata as RawFileObject["metadata"],
        created_at: item.created_at ?? undefined,
      });
    }
  }
  return fileList;
}

/**
 * Fetches all storage objects across all buckets and maps them to database application resources
 */
export async function listAllStorageObjectsWithResourceLinks(): Promise<StorageFileDetail[]> {
  const supabase = createAdminClient();

  // 1. Fetch buckets
  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets || buckets.length === 0) return [];

  // 2. Fetch all raw storage objects
  const rawObjects: RawFileObject[] = [];
  for (const b of buckets) {
    const objs = await listBucketObjectsRecursive(supabase, b.id);
    rawObjects.push(...objs);
  }

  // 3. Fetch resources with course details for database mapping
  const { data: resources } = await supabase
    .from("resources")
    .select(`
      id,
      title,
      slug,
      type,
      status,
      file_url,
      courses (code, title)
    `);

  // Build lookup map by file_url or filename/path match
  const resourceMap = new Map<string, LinkedApplicationResource>();

  if (resources) {
    for (const r of resources) {
      const courseObj = Array.isArray(r.courses) ? r.courses[0] : r.courses;
      const courseCode = courseObj?.code || "";
      const courseTitle = courseObj?.title || "";

      const linked: LinkedApplicationResource = {
        id: r.id,
        title: r.title,
        courseCode,
        courseTitle,
        slug: r.slug,
        type: r.type,
        status: r.status,
      };

      if (r.file_url) {
        resourceMap.set(r.file_url, linked);
        // Also map by path segment if contained in file_url
        const parts = r.file_url.split("/");
        const filename = parts[parts.length - 1];
        if (filename) {
          resourceMap.set(filename, linked);
        }
      }
    }
  }

  // 4. Transform raw objects to StorageFileDetail with application links
  const result: StorageFileDetail[] = rawObjects.map((obj) => {
    const size = obj.metadata?.size || 0;
    const mime = obj.metadata?.mimetype || "";
    const category = categorizeFileType(obj.name, mime);

    // Get public URL
    const { data: urlData } = supabase.storage.from(obj.bucket).getPublicUrl(obj.path);
    const publicUrl = urlData.publicUrl;

    // Match linked resource
    const filenameOnly = obj.name;
    const linked = resourceMap.get(publicUrl) || resourceMap.get(filenameOnly) || resourceMap.get(obj.path);

    let resourceAppUrl: string | undefined = undefined;
    let courseAppUrl: string | undefined = undefined;

    if (linked) {
      if (linked.courseCode && linked.slug) {
        resourceAppUrl = `/course/${linked.courseCode}/resource/${linked.slug}`;
      } else if (linked.slug) {
        resourceAppUrl = `/resource/${linked.slug}`;
      }
      if (linked.courseCode) {
        courseAppUrl = `/course/${linked.courseCode}`;
      }
    }

    return {
      id: obj.id || undefined,
      name: obj.name,
      path: obj.path,
      bucket: obj.bucket,
      sizeBytes: size,
      created_at: obj.created_at || new Date().toISOString(),
      fileType: category,
      publicUrl,
      resourceAppUrl,
      courseAppUrl,
      linkedResource: linked,
    };
  });

  return result;
}

/**
 * Server-side deletion of single or multiple files from Supabase storage
 */
export async function deleteStorageObjectsServer(
  bucket: string,
  paths: string[]
): Promise<{ success: boolean; deletedCount: number; message: string }> {
  if (!paths || paths.length === 0) {
    return { success: false, deletedCount: 0, message: "No files specified for deletion" };
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage.from(bucket).remove(paths);

    if (error) {
      logGuardrailEvent({
        event: "METRIC_RETRIEVAL_FAILED",
        error: `Storage delete error: ${error.message}`,
      });
      return { success: false, deletedCount: 0, message: `Failed to delete from bucket ${bucket}: ${error.message}` };
    }

    const deletedCount = data ? data.length : paths.length;
    logGuardrailEvent({
      event: "STORAGE_HEALTH_CHANGED",
      details: { deletedCount, bucket, paths },
    });

    return {
      success: true,
      deletedCount,
      message: `Successfully deleted ${deletedCount} object(s) from ${bucket}.`,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Deletion failed";
    return { success: false, deletedCount: 0, message: errorMsg };
  }
}
