import { db } from "@/lib/db";
import { resources, courses } from "@/lib/db/schema/courses";
import { listFiles, deleteFile, getPublicUrl } from "@/lib/storage";
import { StorageFileDetail, LinkedApplicationResource, FileTypeCategoryUsage } from "./types";
import { logGuardrailEvent } from "./logger";
import { eq } from "drizzle-orm";

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

/**
 * Fetches all storage objects from Filebase S3 bucket and maps them to database application resources
 */
export async function listAllStorageObjectsWithResourceLinks(): Promise<StorageFileDetail[]> {
  try {
    // 1. Fetch all objects from Filebase S3
    const s3Files = await listFiles("", 1000);

    // 2. Fetch resources with course details from Drizzle
    const dbResources = await db
      .select({
        id: resources.id,
        title: resources.title,
        slug: resources.slug,
        type: resources.type,
        status: resources.status,
        file_url: resources.file_url,
        course_code: courses.code,
        course_title: courses.title,
      })
      .from(resources)
      .leftJoin(courses, eq(resources.course_id, courses.id));

    // Build lookup map by file_url or filename/path match
    const resourceMap = new Map<string, LinkedApplicationResource>();

    for (const r of dbResources) {
      const linked: LinkedApplicationResource = {
        id: r.id,
        title: r.title,
        courseCode: r.course_code || "",
        courseTitle: r.course_title || "",
        slug: r.slug,
        type: r.type,
        status: r.status,
      };

      if (r.file_url) {
        resourceMap.set(r.file_url, linked);
        const parts = r.file_url.split("/");
        const filename = parts[parts.length - 1];
        if (filename) {
          resourceMap.set(filename, linked);
        }
      }
    }

    // 3. Transform S3 objects to StorageFileDetail
    return s3Files.map((obj) => {
      const size = obj.size || 0;
      const category = categorizeFileType(obj.key);
      const publicUrl = getPublicUrl(obj.key);

      const filenameOnly = obj.key.split("/").pop() || obj.key;
      const linked = resourceMap.get(publicUrl) || resourceMap.get(filenameOnly) || resourceMap.get(obj.key);

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
        id: obj.key,
        name: filenameOnly,
        path: obj.key,
        bucket: "studzy",
        sizeBytes: size,
        created_at: obj.lastModified ? new Date(obj.lastModified).toISOString() : new Date().toISOString(),
        fileType: category,
        publicUrl,
        resourceAppUrl,
        courseAppUrl,
        linkedResource: linked,
      };
    });
  } catch (error) {
    console.error("Failed to list Filebase storage objects:", error);
    return [];
  }
}

/**
 * Server-side deletion of single or multiple files from Filebase storage
 */
export async function deleteStorageObjectsServer(
  bucket: string,
  paths: string[]
): Promise<{ success: boolean; deletedCount: number; message: string }> {
  if (!paths || paths.length === 0) {
    return { success: false, deletedCount: 0, message: "No files specified for deletion" };
  }

  try {
    let deletedCount = 0;
    for (const key of paths) {
      await deleteFile(key);
      deletedCount++;
    }

    logGuardrailEvent({
      event: "STORAGE_HEALTH_CHANGED",
      details: { deletedCount, bucket, paths },
    });

    return {
      success: true,
      deletedCount,
      message: `Successfully deleted ${deletedCount} object(s) from Filebase.`,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Deletion failed";
    return { success: false, deletedCount: 0, message: errorMsg };
  }
}
