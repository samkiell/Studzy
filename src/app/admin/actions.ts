"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin";
import { revalidatePath } from "next/cache";
import type { ResourceType } from "@/types/database";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

const ALLOWED_TYPES: Record<ResourceType, string[]> = {
  audio: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp3", "audio/m4a", "audio/x-m4a"],
  video: ["video/mp4", "video/webm", "video/ogg", "video/quicktime"],
  pdf: ["application/pdf"],
  image: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"],
};

interface UploadResult {
  success: boolean;
  message: string;
  resourceId?: string;
}

export async function uploadResource(formData: FormData): Promise<UploadResult> {
  try {
    // Check admin status
    await requireAdmin();

    const supabase = await createClient();

    // Extract form data
    const courseId = formData.get("courseId") as string;
    const title = formData.get("title") as string;
    const type = formData.get("type") as ResourceType;
    const description = formData.get("description") as string | null;
    const file = formData.get("file") as File | null;

    // Validate required fields
    if (!courseId) {
      return { success: false, message: "Please select a course" };
    }

    if (!title || title.trim().length === 0) {
      return { success: false, message: "Please enter a title" };
    }

    if (!type || !["audio", "video", "pdf", "image"].includes(type)) {
      return { success: false, message: "Please select a valid resource type" };
    }

    if (!file || file.size === 0) {
      return { success: false, message: "Please select a file to upload" };
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        message: `File size exceeds maximum limit of 100MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
      };
    }

    // Validate file type
    const allowedMimeTypes = ALLOWED_TYPES[type];
    if (!allowedMimeTypes.includes(file.type)) {
      return {
        success: false,
        message: `Invalid file type for ${type}. Expected ${allowedMimeTypes.join(", ")}`,
      };
    }

    // Generate unique filename
    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "";
    const timestamp = Date.now();
    const sanitizedTitle = title.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const fileName = `${type}/${courseId}/${timestamp}-${sanitizedTitle}.${fileExtension}`;

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("RAG")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return {
        success: false,
        message: `Failed to upload file: ${uploadError.message}`,
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("RAG")
      .getPublicUrl(uploadData.path);

    const fileUrl = urlData.publicUrl;

    // Insert resource into database
    const { data: resource, error: insertError } = await supabase
      .from("resources")
      .insert({
        course_id: courseId,
        title: title.trim(),
        type,
        file_url: fileUrl,
        description: description?.trim() || null,
      })
      .select()
      .single();

    if (insertError) {
      // Try to clean up the uploaded file
      await supabase.storage.from("RAG").remove([uploadData.path]);

      console.error("Database insert error:", insertError);
      return {
        success: false,
        message: `Failed to save resource: ${insertError.message}`,
      };
    }

    // 🎓 RAG: If this is a PDF, trigger ingestion automatically
    if (type === "pdf") {
      try {
        const { ingestFile } = await import("@/lib/rag/ingestion");
        console.log(`[Admin Upload] Triggering auto-ingestion for: ${uploadData.path}`);
        
        // This runs asynchronously in the background
        ingestFile({
          filePath: uploadData.path,
          courseCode: courseId,
          force: true,
          username: "admin", // Tag as admin-uploaded
        }).catch(err => {
          console.error(`[Admin Upload] Ingestion failed for ${uploadData.path}:`, err);
        });
      } catch (err) {
        console.error(`[Admin Upload] Failed to trigger ingestion:`, err);
      }
    }

    // Revalidate the course page to show new resource
    revalidatePath(`/course/${courseId}`);
    revalidatePath("/dashboard");
    revalidatePath("/admin/upload");

    return {
      success: true,
      message: "Resource uploaded successfully!",
      resourceId: resource.id,
    };
  } catch (error) {
    console.error("Upload error:", error);

    if (error instanceof Error) {
      if (error.message === "Not authenticated") {
        return { success: false, message: "Please log in to upload resources" };
      }
      if (error.message.includes("Admin")) {
        return { success: false, message: "You do not have permission to upload resources" };
      }
      return { success: false, message: error.message };
    }

    return { success: false, message: "An unexpected error occurred" };
  }
}

export async function deleteResource(resourceId: string): Promise<UploadResult> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    // Get the resource to find the file URL
    const { data: resource, error: fetchError } = await supabase
      .from("resources")
      .select("*")
      .eq("id", resourceId)
      .single();

    if (fetchError || !resource) {
      return { success: false, message: "Resource not found" };
    }

    // Extract file path from URL
    const url = new URL(resource.file_url);
    const pathParts = url.pathname.split("/storage/v1/object/public/RAG/");
    const filePath = pathParts[1];

    if (filePath) {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("RAG")
        .remove([filePath]);

      if (storageError) {
        console.error("Storage delete error:", storageError);
      }
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from("resources")
      .delete()
      .eq("id", resourceId);

    if (deleteError) {
      return { success: false, message: `Failed to delete resource: ${deleteError.message}` };
    }

    revalidatePath(`/course/${resource.course_id}`);
    revalidatePath("/dashboard");

    return { success: true, message: "Resource deleted successfully" };
  } catch (error) {
    console.error("Delete error:", error);
    return { success: false, message: "Failed to delete resource" };
  }
}

export async function createCourse(formData: FormData): Promise<UploadResult> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const code = (formData.get("code") as string)?.trim().toUpperCase();
    const title = (formData.get("title") as string)?.trim();
    const description = (formData.get("description") as string)?.trim() || null;

    if (!code || !title) {
      return { success: false, message: "Code and Title are required" };
    }

    const { data: course, error } = await supabase
      .from("courses")
      .insert({ code, title, description })
      .select()
      .single();

    if (error) {
      console.error("Create course error:", error);
      return { success: false, message: `Failed to create course: ${error.message}` };
    }

    revalidatePath("/dashboard");
    revalidatePath("/admin/courses");

    return { success: true, message: "Course created successfully!", resourceId: course.id };
  } catch (error: any) {
    return { success: false, message: error.message || "An unexpected error occurred" };
  }
}

export async function updateCourse(formData: FormData): Promise<UploadResult> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const id = formData.get("id") as string;
    const code = (formData.get("code") as string)?.trim().toUpperCase();
    const title = (formData.get("title") as string)?.trim();
    const description = (formData.get("description") as string)?.trim() || null;

    if (!id || !code || !title) {
      return { success: false, message: "ID, Code, and Title are required" };
    }

    const { error } = await supabase
      .from("courses")
      .update({ code, title, description })
      .eq("id", id);

    if (error) {
      console.error("Update course error:", error);
      return { success: false, message: `Failed to update course: ${error.message}` };
    }

    revalidatePath("/dashboard");
    revalidatePath(`/course/${code}`);
    revalidatePath("/admin/courses");

    return { success: true, message: "Course updated successfully!" };
  } catch (error: any) {
    return { success: false, message: error.message || "An unexpected error occurred" };
  }
}

export async function deleteCourse(courseId: string): Promise<UploadResult> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    // Check if course has resources
    const { count } = await supabase
      .from("resources")
      .select("*", { count: "exact", head: true })
      .eq("course_id", courseId);

    if (count && count > 0) {
      return { 
        success: false, 
        message: `Cannot delete course with ${count} resources. Please delete or move resources first.` 
      };
    }

    const { error } = await supabase
      .from("courses")
      .delete()
      .eq("id", courseId);

    if (error) {
      return { success: false, message: `Failed to delete course: ${error.message}` };
    }

    revalidatePath("/dashboard");
    revalidatePath("/admin/courses");

    return { success: true, message: "Course deleted successfully" };
  } catch (error: any) {
    return { success: false, message: error.message || "An unexpected error occurred" };
  }
}

