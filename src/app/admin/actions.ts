"use server";

import { requireAdmin } from "@/lib/admin";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { notifyStudentsOfNewContent } from "@/lib/notifications";
import type { ResourceType } from "@/types/database";
import { db } from "@/lib/db";
import { courses, resources } from "@/lib/db/schema/courses";
import { questions } from "@/lib/db/schema/cbt";
import { eq, desc, and } from "drizzle-orm";
import { uploadFile, deleteFile } from "@/lib/storage";
import { validateCBTQuestionList } from "@/lib/cbt/validation";
import { CBTQuestion } from "@/types/cbt";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

const ALLOWED_TYPES: Record<ResourceType, string[]> = {
  audio: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp3", "audio/m4a", "audio/x-m4a"],
  video: ["video/mp4", "video/webm", "video/ogg", "video/quicktime"],
  pdf: ["application/pdf"],
  image: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"],
  document: [
    "text/plain",
    "text/markdown",
    "text/csv",
    "application/json",
    "text/javascript",
    "application/javascript",
    "application/typescript",
    "text/x-typescript",
    "text/x-python",
    "application/x-python-code",
  ],
  question_bank: ["application/json"],
};

interface UploadResult {
  success: boolean;
  message: string;
  resourceId?: string;
}

export async function uploadResource(formData: FormData): Promise<UploadResult> {
  try {
    const admin = await requireAdmin();

    // Extract form data
    const courseId = formData.get("courseId") as string;
    const title = formData.get("title") as string;
    const type = formData.get("type") as ResourceType;
    const description = formData.get("description") as string | null;
    const file = formData.get("file") as File | null;

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

    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        message: `File size exceeds maximum limit of 100MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
      };
    }

    const allowedMimeTypes = ALLOWED_TYPES[type];
    if (!allowedMimeTypes.includes(file.type)) {
      return {
        success: false,
        message: `Invalid file type for ${type}. Expected ${allowedMimeTypes.join(", ")}`,
      };
    }

    // Generate unique storage key
    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "";
    const timestamp = Date.now();
    const sanitizedTitle = title.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const key = `materials/${type}/${courseId}/${timestamp}-${sanitizedTitle}.${fileExtension}`;

    // Upload to Filebase
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileUrl = await uploadFile({
      key,
      body: buffer,
      contentType: file.type,
      metadata: {
        uploaderId: admin.id,
        courseId,
      },
    });

    const slug = `${sanitizedTitle}-${timestamp}`.slice(0, 90);

    // Insert resource into database
    const [resource] = await db
      .insert(resources)
      .values({
        course_id: courseId,
        title: title.trim(),
        slug,
        type,
        file_url: fileUrl,
        description: description?.trim() || null,
        uploader_id: admin.id,
        email_sent: true,
        status: "published",
      })
      .returning();

    // RAG: Trigger ingestion automatically for searchable types
    if (type === "pdf" || type === "document") {
      try {
        const { ingestFile } = await import("@/lib/rag/ingestion");
        console.log(`[Admin Upload] Triggering auto-ingestion for: ${key}`);
        
        ingestFile({
          filePath: key,
          courseCode: courseId,
          force: true,
          username: "admin",
        }).catch((err) => {
          console.error(`[Admin Upload] Ingestion failed for ${key}:`, err);
        });
      } catch (err) {
        console.error(`[Admin Upload] Failed to trigger ingestion:`, err);
      }
    }

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

    const [resource] = await db
      .select()
      .from(resources)
      .where(eq(resources.id, resourceId))
      .limit(1);

    if (!resource) {
      return { success: false, message: "Resource not found" };
    }

    // Try deleting from storage if URL is Filebase S3
    try {
      if (resource.file_url.includes(".s3.filebase.com/")) {
        const key = resource.file_url.split(".s3.filebase.com/")[1];
        if (key) {
          await deleteFile(key);
        }
      }
    } catch (storageError) {
      console.error("Storage delete error:", storageError);
    }

    // Delete from database
    await db.delete(resources).where(eq(resources.id, resourceId));

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

    const code = (formData.get("code") as string)?.trim().toUpperCase();
    const title = (formData.get("title") as string)?.trim();
    const description = (formData.get("description") as string)?.trim() || null;
    const is_cbt = formData.get("is_cbt") === "true";

    if (!code || !title) {
      return { success: false, message: "Code and Title are required" };
    }

    const [course] = await db
      .insert(courses)
      .values({ code, title, description, is_cbt })
      .returning();

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

    const id = formData.get("id") as string;
    const code = (formData.get("code") as string)?.trim().toUpperCase();
    const title = (formData.get("title") as string)?.trim();
    const description = (formData.get("description") as string)?.trim() || null;
    const is_cbt = formData.get("is_cbt") === "true";

    if (!id || !code || !title) {
      return { success: false, message: "ID, Code, and Title are required" };
    }

    await db
      .update(courses)
      .set({ code, title, description, is_cbt })
      .where(eq(courses.id, id));

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

    // Check if course has resources
    const courseResources = await db
      .select({ id: resources.id })
      .from(resources)
      .where(eq(resources.course_id, courseId));

    if (courseResources && courseResources.length > 0) {
      return { 
        success: false, 
        message: `Cannot delete course with ${courseResources.length} resources. Please delete or move resources first.` 
      };
    }

    await db.delete(courses).where(eq(courses.id, courseId));

    revalidatePath("/dashboard");
    revalidatePath("/admin/courses");

    return { success: true, message: "Course deleted successfully" };
  } catch (error: any) {
    return { success: false, message: error.message || "An unexpected error occurred" };
  }
}

export async function uploadCBTQuestions(formData: FormData) {
  try {
    const admin = await requireAdmin();

    const file = formData.get("file") as File | null;
    const courseCode = formData.get("courseCode") as string;
    const customTitle = (formData.get("title") as string)?.trim();
    const customSlug = (formData.get("slug") as string)?.trim();
    const customDescription = (formData.get("description") as string)?.trim();

    if (!file) {
      return { success: false, message: "No file provided" };
    }

    if (!courseCode) {
      return { success: false, message: "Course code is required" };
    }

    // Determine clean title
    const cleanFileNameTitle = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ").trim();
    const finalTitle = customTitle || cleanFileNameTitle || file.name;

    // 1. Upload the file to Filebase Storage
    const timestamp = Date.now();
    const key = `question-banks/${courseCode}/${timestamp}-${file.name}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileUrl = await uploadFile({
      key,
      body: buffer,
      contentType: file.type || "application/json",
      metadata: {
        courseCode,
        uploaderId: admin.id,
      },
    });

    // 2. Resolve Course ID
    const [courseData] = await db
      .select({ id: courses.id })
      .from(courses)
      .where(eq(courses.code, courseCode))
      .limit(1);
    
    if (!courseData) {
      return { success: false, message: `Course not found for code: ${courseCode}` };
    }

    // 2b. Record the uploaded JSON as a question_bank resource
    const bankSlug = customSlug || `qb-${timestamp}-${finalTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")}`.slice(0, 90);

    const [bankResource] = await db
      .insert(resources)
      .values({
        course_id: courseData.id,
        title: finalTitle,
        slug: bankSlug,
        description: customDescription || null,
        type: "question_bank",
        file_url: fileUrl,
        status: "published",
        uploader_id: admin.id,
      })
      .returning({ id: resources.id });

    const bankId = bankResource?.id ?? null;

    // 3. Process the Questions
    const content = await file.text();
    let data: unknown;
    try {
      data = JSON.parse(content);
    } catch (e) {
      return { success: false, message: "Invalid JSON format" };
    }

    let validatedQuestions: CBTQuestion[];
    try {
      validatedQuestions = validateCBTQuestionList(data, courseCode);
    } catch (err: any) {
      return { success: false, message: `Validation failed: ${err.message}` };
    }

    const mismatched = validatedQuestions.filter((q) => q.course_code !== courseCode);
    if (mismatched.length > 0) {
      return { 
        success: false, 
        message: `Found ${mismatched.length} questions with mismatched course codes. All questions must belong to ${courseCode}.` 
      };
    }

    // 4. Calculate Offset for Additive Uploads
    const [maxIdData] = await db
      .select({ question_id: questions.question_id })
      .from(questions)
      .where(eq(questions.course_id, courseData.id))
      .orderBy(desc(questions.question_id))
      .limit(1);

    const currentMaxId = maxIdData?.question_id || 0;

    // Insert questions
    const questionValues = validatedQuestions.map((q, idx) => ({
      course_id: courseData.id,
      bank_id: bankId,
      course_code: courseCode,
      question_id: currentMaxId + (idx + 1),
      difficulty: q.difficulty || null,
      topic: q.topic || null,
      question_text: q.question_text,
      options: q.options,
      correct_option: q.correct_option || null,
      explanation: q.explanation || null,
      question_type: q.question_type || "multiple_choice",
      model_answer: q.model_answer || null,
      key_points: q.key_points || null,
      rubric: q.rubric || null,
      sub_questions: q.sub_questions || null,
    }));

    if (questionValues.length > 0) {
      await db.insert(questions).values(questionValues);
    }

    // Ensure the course is flagged as a CBT course
    await db
      .update(courses)
      .set({ is_cbt: true })
      .where(and(eq(courses.id, courseData.id), eq(courses.is_cbt, false)));

    revalidatePath("/admin/upload");
    revalidatePath("/admin/questions");
    revalidatePath("/cbt");

    if (validatedQuestions.length > 0) {
      after(() =>
        notifyStudentsOfNewContent({
          kind: "questions",
          courseId: courseData.id,
          courseCode,
          count: validatedQuestions.length,
        })
      );
    }

    return {
      success: true,
      message: `Successfully processed ${validatedQuestions.length} questions.`,
      summary: {
        total: validatedQuestions.length,
        inserted: validatedQuestions.length,
        skipped: 0, 
      }
    };
  } catch (error: any) {
    console.error("CBT Upload Error:", error);
    return { success: false, message: error.message || "An unexpected error occurred" };
  }
}

export async function deleteQuestion(questionId: string): Promise<UploadResult> {
  try {
    await requireAdmin();

    await db.delete(questions).where(eq(questions.id, questionId));

    revalidatePath("/admin/questions");
    revalidatePath("/cbt");

    return { success: true, message: "Question deleted successfully" };
  } catch (error: any) {
    return { success: false, message: error.message || "An unexpected error occurred" };
  }
}

export async function deleteQuestionBank(resourceId: string): Promise<UploadResult> {
  try {
    await requireAdmin();

    // 1. Delete all questions belonging to this bank
    await db.delete(questions).where(eq(questions.bank_id, resourceId));

    // 2. Delete the file record + storage object
    const fileResult = await deleteResource(resourceId);
    if (!fileResult.success) {
      return {
        success: false,
        message: `Deleted questions, but removing the file failed: ${fileResult.message}`,
      };
    }

    revalidatePath("/admin/questions");
    revalidatePath("/cbt");

    return {
      success: true,
      message: `Deleted question bank and its questions successfully.`,
    };
  } catch (error: any) {
    return { success: false, message: error.message || "An unexpected error occurred" };
  }
}
