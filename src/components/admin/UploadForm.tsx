"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  Check, 
  PencilLine, 
  CloudUpload, 
  CheckCircle2, 
  AlertCircle, 
  FileStack,
  Trash2,
  Loader2,
  Image as ImageIcon,
  Info,
  ClipboardPaste,
  Code2,
  FileCode
} from "lucide-react";
import type { Course, ResourceType, ResourceStatus } from "@/types/database";
import { uploadCBTQuestions } from "@/app/admin/actions";
import { CBTUploadToggle } from "./cbt/CBTUploadToggle";
import { CourseSelector } from "./cbt/CourseSelector";
import { JSONFileInput } from "./cbt/JSONFileInput";
import { UploadSummary } from "./cbt/UploadSummary";
import { CBTPreview } from "./cbt/CBTPreview";

interface UploadFormProps {
  courses: Course[];
}

interface FileUpload {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "uploaded" | "saving" | "success" | "error";
  message?: string;
  title: string;
  slug: string;
  description: string;
  fileUrl?: string;
  storagePath?: string;
  type: ResourceType;
}

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

const FILE_TYPES: Record<ResourceType, { accept: string; label: string }> = {
  audio: { accept: "audio/*,.mp3,.wav,.ogg,.m4a", label: "Audio files (MP3, WAV, OGG, M4A)" },
  video: { accept: "video/*,.mp4,.webm,.mov", label: "Video files (MP4, WebM, MOV)" },
  pdf: { accept: ".pdf,application/pdf", label: "PDF documents" },
  image: { accept: "image/*,.jpg,.jpeg,.png,.webp,.svg,.gif", label: "Image files (JPG, PNG, WebP, SVG)" },
  document: { accept: ".txt,.md,.json,.csv,.js,.ts,.py,.tsx,.jsx,application/json", label: "Documents & JSON (.pdf, .json, .txt, .md)" },
  question_bank: { accept: ".json,application/json", label: "CBT Question Bank (JSON)" },
};

// Auto-detect resource type from MIME type
const detectResourceType = (file: File): ResourceType | null => {
  const mimeType = file.type.toLowerCase();
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/json") return "document";
  
  // Fallback: check file extension
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (["mp4", "webm", "mov", "avi"].includes(ext || "")) return "video";
  if (["mp3", "wav", "ogg", "m4a", "flac"].includes(ext || "")) return "audio";
  if (ext === "pdf") return "pdf";
  if (["jpg", "jpeg", "png", "webp", "svg", "gif"].includes(ext || "")) return "image";
  if (["txt", "md", "json", "csv", "js", "ts", "py", "tsx", "jsx"].includes(ext || "")) return "document";
  
  return null;
};

export function UploadForm({ courses }: UploadFormProps) {
  const router = useRouter();
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [isRAG, setIsRAG] = useState(false);
  const [isCbtMode, setIsCbtMode] = useState(false);
  const [cbtFile, setCbtFile] = useState<File | null>(null);
  const [cbtTitle, setCbtTitle] = useState("");
  const [cbtSlug, setCbtSlug] = useState("");
  const [cbtDescription, setCbtDescription] = useState("");
  const [cbtSummary, setCbtSummary] = useState<any>(null);

  const handleCbtFileSelect = (file: File | null) => {
    setCbtFile(file);
    if (file) {
      const autoTitle = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ").trim();
      setCbtTitle(autoTitle);
      const autoSlug = autoTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 50);
      setCbtSlug(autoSlug);
    } else {
      setCbtTitle("");
      setCbtSlug("");
      setCbtDescription("");
    }
  };
  const [cbtPreview, setCbtPreview] = useState<{
    totalQuestions: number;
    topics: { name: string; count: number }[];
    difficultyCounts: Record<string, number>;
    questionTypes: Record<string, number>;
    isValid: boolean;
    errors: string[];
  } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ResourceStatus>("published");
  const [globalMessage, setGlobalMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [pasteTitle, setPasteTitle] = useState("");
  const [pasteError, setPasteError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);

  // Scroll to message when it appears
  useEffect(() => {
    if (globalMessage && messageRef.current) {
      messageRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [globalMessage]);

  // Parse CBT JSON file to show preview
  useEffect(() => {
    if (!cbtFile) {
      setCbtPreview(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);

        if (!Array.isArray(parsed)) {
          setCbtPreview({
            totalQuestions: 0,
            topics: [],
            difficultyCounts: {},
            questionTypes: {},
            isValid: false,
            errors: ["CBT data must be a JSON array of questions."],
          });
          return;
        }

        const topicsMap: Record<string, number> = {};
        const difficulties: Record<string, number> = {};
        const types: Record<string, number> = {};
        const errors: string[] = [];

        parsed.forEach((q: any, index: number) => {
          const qNum = index + 1;
          if (!q.question_text) {
            errors.push(`Question #${qNum} is missing "question_text".`);
          }

          const type = q.question_type || "mcq";
          types[type] = (types[type] || 0) + 1;

          if (type === "mcq") {
            if (!q.options || typeof q.options !== "object") {
              errors.push(`Question #${qNum} (MCQ) is missing "options" object.`);
            } else if (!q.correct_option) {
              errors.push(`Question #${qNum} (MCQ) is missing "correct_option".`);
            }
          } else {
            if (!q.model_answer) {
              errors.push(`Question #${qNum} (Theory) is missing "model_answer".`);
            }
          }

          const topic = q.topic || "Uncategorized";
          topicsMap[topic] = (topicsMap[topic] || 0) + 1;

          const difficulty = q.difficulty || "medium";
          difficulties[difficulty] = (difficulties[difficulty] || 0) + 1;
        });

        const topics = Object.entries(topicsMap)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count);

        setCbtPreview({
          totalQuestions: parsed.length,
          topics,
          difficultyCounts: difficulties,
          questionTypes: types,
          isValid: errors.length === 0,
          errors: errors.slice(0, 5),
        });
      } catch (err: any) {
        setCbtPreview({
          totalQuestions: 0,
          topics: [],
          difficultyCounts: {},
          questionTypes: {},
          isValid: false,
          errors: [`Failed to parse JSON: ${err.message}`],
        });
      }
    };
    reader.readAsText(cbtFile);
  }, [cbtFile]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelect(Array.from(e.dataTransfer.files));
    }
  }, [selectedCourseId, isRAG]);

  // Upload file to Filebase storage via direct presigned URL (with live XHR progress) or fallback
  const uploadFileToStorage = useCallback(async (fileUpload: FileUpload): Promise<{ fileUrl: string; storagePath: string } | null> => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileUpload.id ? { ...f, status: "uploading", progress: 5, message: "Preparing upload..." } : f
      )
    );

    try {
      // 1. Request presigned upload URL (bypasses serverless payload limits for videos and large files)
      const presignRes = await fetch("/api/admin/upload-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: fileUpload.file.name,
          fileType: fileUpload.file.type || "application/octet-stream",
          fileSize: fileUpload.file.size,
          type: fileUpload.type,
          courseId: selectedCourseId || null,
          isRAG,
        }),
      });

      const presignText = await presignRes.text();
      let presignData: any;
      try {
        presignData = JSON.parse(presignText);
      } catch {
        // If server returned HTML or non-JSON
        if (presignRes.status === 413) {
          throw new Error("File exceeds server upload limits (413 Payload Too Large).");
        }
        throw new Error(`Upload preparation failed with status ${presignRes.status}`);
      }

      if (!presignRes.ok || !presignData?.success) {
        throw new Error(presignData?.message || "Failed to initialize storage upload");
      }

      // 2. Direct upload to S3/Filebase via Presigned PUT URL
      if (presignData?.directUpload && presignData?.uploadUrl) {
        try {
          await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("PUT", presignData.uploadUrl);
            const fileMime = fileUpload.file.type || "application/octet-stream";
            xhr.setRequestHeader("Content-Type", fileMime);

            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable && e.total > 0) {
                const pct = Math.min(99, Math.round((e.loaded / e.total) * 100));
                setFiles((prev) =>
                  prev.map((f) =>
                    f.id === fileUpload.id
                      ? { ...f, progress: pct, message: `Uploading (${pct}%)...` }
                      : f
                  )
                );
              }
            };

            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                resolve();
              } else {
                let errorMsg = `Direct storage upload returned HTTP ${xhr.status}`;
                try {
                  const parser = new DOMParser();
                  const xml = parser.parseFromString(xhr.responseText, "application/xml");
                  const code = xml.querySelector("Code")?.textContent;
                  const message = xml.querySelector("Message")?.textContent;
                  if (code || message) {
                    errorMsg = `Storage error (${xhr.status}): ${message || code}`;
                  }
                } catch {}
                reject(new Error(errorMsg));
              }
            };

            xhr.onerror = () => reject(new Error("Network error during direct storage upload."));
            xhr.ontimeout = () => reject(new Error("Storage upload timed out."));
            xhr.send(fileUpload.file);
          });

          // Trigger RAG ingestion if needed
          if (isRAG && (fileUpload.type === "pdf" || fileUpload.type === "document")) {
            fetch("/api/admin/trigger-ingestion", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ filePath: presignData.storagePath }),
            }).catch((err) => console.error("[RAG] Background trigger error:", err));
          }

          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileUpload.id
                ? {
                    ...f,
                    progress: 100,
                    status: "uploaded",
                    fileUrl: presignData.fileUrl,
                    storagePath: presignData.storagePath,
                    message: "Ready to save",
                  }
                : f
            )
          );

          return { fileUrl: presignData.fileUrl, storagePath: presignData.storagePath };
        } catch (directUploadErr: any) {
          if (fileUpload.file.size > 4.5 * 1024 * 1024) {
            throw directUploadErr;
          }
          console.warn("Direct storage upload failed, falling back to server proxy upload:", directUploadErr);
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileUpload.id
                ? { ...f, progress: 10, message: "Uploading via server proxy..." }
                : f
            )
          );
        }
      }

      // 3. Fallback: Proxy upload via FormData with live progress
      const formData = new FormData();
      formData.append("file", fileUpload.file);
      formData.append("type", fileUpload.type);
      if (selectedCourseId) formData.append("courseId", selectedCourseId);
      if (isRAG) formData.append("isRAG", "true");

      const data: any = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/admin/upload-file");

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable && e.total > 0) {
            const pct = Math.min(99, Math.round((e.loaded / e.total) * 100));
            setFiles((prev) =>
              prev.map((f) =>
                f.id === fileUpload.id
                  ? { ...f, progress: pct, message: `Uploading (${pct}%)...` }
                  : f
              )
            );
          }
        };

        xhr.onload = () => {
          let resData: any;
          try {
            resData = JSON.parse(xhr.responseText);
          } catch {
            if (xhr.status === 413) {
              return reject(new Error("File exceeds serverless proxy payload limits (413). Please upload a smaller file."));
            }
            return reject(new Error(`Upload failed with status ${xhr.status}`));
          }

          if (xhr.status >= 200 && xhr.status < 300 && resData?.success) {
            resolve(resData);
          } else {
            reject(new Error(resData?.message || `Upload failed with status ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error("Network error during upload. Please check connection."));
        xhr.ontimeout = () => reject(new Error("Upload timed out. Please try again."));
        xhr.send(formData);
      });

      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileUpload.id
            ? { ...f, progress: 100, status: "uploaded", fileUrl: data.fileUrl, storagePath: data.storagePath, message: "Ready to save" }
            : f
        )
      );

      return { fileUrl: data.fileUrl, storagePath: data.storagePath };
    } catch (error: any) {
      console.error("Upload failed:", error);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileUpload.id
            ? { ...f, status: "error", message: error.message || "Upload failed" }
            : f
        )
      );
      return null;
    }
  }, [isRAG, selectedCourseId]);

  const handleFilesSelect = async (newFiles: File[]) => {
    if (!selectedCourseId && !isRAG) {
      setGlobalMessage({ type: "error", text: "Please select a course or enable RAG mode first" });
      return;
    }

    const validFiles: FileUpload[] = [];
    const errors: string[] = [];
    const currentFileNames = new Set(files.map((f) => f.file.name.toLowerCase()));

    newFiles.forEach((file) => {
      if (currentFileNames.has(file.name.toLowerCase())) {
        errors.push(`${file.name}: already added to upload queue`);
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: exceeds 100MB limit`);
        return;
      }

      // Auto-detect file type
      const detectedType = detectResourceType(file);
      if (!detectedType) {
        errors.push(`${file.name}: unsupported file type`);
        return;
      }

      // Auto-generate title from filename (strip extension)
      const autoTitle = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      
      // Auto-generate slug from title
      const autoSlug = autoTitle.toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 50);

      validFiles.push({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        progress: 0,
        status: "pending",
        title: autoTitle,
        slug: autoSlug,
        description: "",
        type: detectedType,
      });
    });

    if (errors.length > 0) {
      setGlobalMessage({
        type: "error",
        text: `Some files were rejected: ${errors.join("; ")}`,
      });
    }

    if (validFiles.length > 0) {
      setFiles((prev) => [...prev, ...validFiles]);
      if (errors.length === 0) setGlobalMessage(null);

      // Start uploading files immediately
      for (const fileUpload of validFiles) {
        await uploadFileToStorage(fileUpload);
      }
    }
  };

  const compilePastedJsonToFile = useCallback((text: string, title?: string): boolean => {
    try {
      const trimmed = text.trim();
      if (!trimmed) {
        setPasteError("Please enter or paste valid JSON text.");
        return false;
      }
      const parsed = JSON.parse(trimmed);
      const formatted = JSON.stringify(parsed, null, 2);

      // Auto generate descriptive title and filename
      let autoName = title?.trim() || "";
      if (!autoName) {
        if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed) && (parsed.title || parsed.name || parsed.course_code)) {
          autoName = String(parsed.title || parsed.name || parsed.course_code);
        } else if (Array.isArray(parsed)) {
          autoName = `question-bank-${Date.now()}`;
        } else {
          autoName = `document-${Date.now()}`;
        }
      }

      const cleanSlug = autoName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || `document-${Date.now()}`;
      const filename = `${cleanSlug}.json`;

      const compiledFile = new File([formatted], filename, {
        type: "application/json",
      });

      if (isCbtMode) {
        setCbtFile(compiledFile);
        setGlobalMessage({
          type: "success",
          text: `Pasted JSON compiled into "${filename}" for CBT!`,
        });
      } else {
        handleFilesSelect([compiledFile]);
        setGlobalMessage({
          type: "success",
          text: `Compiled pasted JSON into "${filename}" and added to queue.`,
        });
      }

      setPasteText("");
      setPasteTitle("");
      setPasteError(null);
      setShowPasteModal(false);
      return true;
    } catch (err: any) {
      setPasteError(`Invalid JSON format: ${err.message}`);
      return false;
    }
  }, [isCbtMode, handleFilesSelect]);

  // Handle global or dropzone paste
  const handlePaste = useCallback((e: React.ClipboardEvent | ClipboardEvent) => {
    const target = e.target as HTMLElement;
    if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA") && target.id !== "paste-json-global-drop") {
      return;
    }

    if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
      e.preventDefault();
      const pastedFiles = Array.from(e.clipboardData.files);
      if (isCbtMode) {
        const jsonFile = pastedFiles.find(f => f.name.endsWith(".json") || f.type === "application/json");
        if (jsonFile) setCbtFile(jsonFile);
        else setGlobalMessage({ type: "error", text: "CBT mode only accepts .json files" });
      } else {
        handleFilesSelect(pastedFiles);
      }
      return;
    }

    const text = e.clipboardData?.getData("text");
    if (text && (text.trim().startsWith("{") || text.trim().startsWith("["))) {
      try {
        JSON.parse(text.trim());
        e.preventDefault();
        compilePastedJsonToFile(text);
      } catch {
        // Not JSON
      }
    }
  }, [isCbtMode, handleFilesSelect, compilePastedJsonToFile]);

  useEffect(() => {
    const onGlobalPaste = (e: ClipboardEvent) => {
      handlePaste(e);
    };
    window.addEventListener("paste", onGlobalPaste);
    return () => window.removeEventListener("paste", onGlobalPaste);
  }, [handlePaste]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesSelect(Array.from(e.target.files));
      // Reset input so same files can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeFile = async (id: string) => {
    const file = files.find(f => f.id === id);
    
    // If file was uploaded, delete from storage
    if (file?.storagePath) {
      try {
        await fetch("/api/admin/delete-file", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: file.storagePath }),
        });
      } catch (error) {
        console.error("Failed to delete file from storage:", error);
      }
    }
    
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const updateFileTitle = (id: string, title: string) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id === id) {
          // Also update slug if it was just auto-generated and not manually edited?
          // For now, let's just make it easier for admin to edit both.
          const newSlug = title.toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 50);
          return { ...f, title, slug: newSlug };
        }
        return f;
      })
    );
  };

  const updateFileSlug = (id: string, slug: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, slug: slug.toLowerCase().replace(/[^a-z0-9-]+/g, "") } : f))
    );
  };

  const updateFileDescription = (id: string, description: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, description } : f))
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isCbtMode) {
      if (!cbtFile || !selectedCourseId) {
        setGlobalMessage({ type: "error", text: "Please select a course and a JSON file" });
        return;
      }
      if (!cbtTitle.trim()) {
        setGlobalMessage({ type: "error", text: "Please enter a title for the Question Bank" });
        return;
      }
      setIsSaving(true);
      setGlobalMessage(null);
      
      try {
        const course = courses.find(c => c.id === selectedCourseId);
        const formData = new FormData();
        formData.append("file", cbtFile);
        formData.append("courseCode", course?.code || "");
        formData.append("title", cbtTitle.trim());
        if (cbtSlug.trim()) formData.append("slug", cbtSlug.trim());
        if (cbtDescription.trim()) formData.append("description", cbtDescription.trim());
        
        const result = await uploadCBTQuestions(formData);
        
        if (result.success) {
          setCbtSummary(result.summary);
          setGlobalMessage({ type: "success", text: result.message });
          // Reset file and metadata after success
          setCbtFile(null);
          setCbtTitle("");
          setCbtSlug("");
          setCbtDescription("");
        } else {
          setGlobalMessage({ type: "error", text: result.message });
        }
      } catch (err: any) {
        setGlobalMessage({ type: "error", text: err.message || "CBT Upload failed" });
      } finally {
        setIsSaving(false);
      }
      return;
    }

    if (isRAG) {
      setGlobalMessage({
        type: "success",
        text: `Successfully uploaded ${uploadedCount} file${uploadedCount > 1 ? "s" : ""} to RAG storage!`,
      });
      setTimeout(() => setFiles([]), 1500);
      return;
    }

    if (!selectedCourseId) {
      setGlobalMessage({ type: "error", text: "Please select a course" });
      return;
    }

    const uploadedFiles = files.filter((f) => f.status === "uploaded" && f.fileUrl);
    if (uploadedFiles.length === 0) {
      setGlobalMessage({ type: "error", text: "No files ready to save" });
      return;
    }

    // Check for empty titles
    const emptyTitles = uploadedFiles.filter((f) => !f.title.trim());
    if (emptyTitles.length > 0) {
      setGlobalMessage({ type: "error", text: "Please enter titles for all files" });
      return;
    }

    setIsSaving(true);
    setGlobalMessage(null);

    let successCount = 0;
    let errorCount = 0;
    const savedItems: Array<{ title: string; type: string; slug: string }> = [];

    // Save each file to database
    for (const fileUpload of uploadedFiles) {
      setFiles((prev) =>
        prev.map((f) => (f.id === fileUpload.id ? { ...f, status: "saving" } : f))
      );

      try {
        const response = await fetch("/api/admin/save-resource", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseId: selectedCourseId,
            title: fileUpload.title.trim(),
            slug: fileUpload.slug.trim(),
            description: fileUpload.description.trim(),
            type: fileUpload.type,
            fileUrl: fileUpload.fileUrl,
            status: selectedStatus,
            skipNotification: true,
          }),
        });

        const result = await response.json();

        if (result.success) {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileUpload.id ? { ...f, status: "success", message: "Saved!" } : f
            )
          );
          savedItems.push({
            title: fileUpload.title.trim(),
            type: fileUpload.type,
            slug: fileUpload.slug.trim(),
          });
          successCount++;
        } else {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileUpload.id ? { ...f, status: "error", message: result.message } : f
            )
          );
          errorCount++;
        }
      } catch {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileUpload.id ? { ...f, status: "error", message: "Failed to save" } : f
          )
        );
        errorCount++;
      }
    }

    // Send a single consolidated notification email for the entire upload batch
    if (savedItems.length > 0 && selectedStatus === "published" && selectedCourseId) {
      fetch("/api/admin/notify-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: selectedCourseId,
          items: savedItems,
        }),
      }).catch((err) => console.error("Batch notification error:", err));
    }

    setIsSaving(false);

    if (errorCount === 0 && successCount > 0) {
      setGlobalMessage({
        type: "success",
        text: `Successfully saved ${successCount} resource${successCount > 1 ? "s" : ""}!`,
      });
      // Clear uploaded files after a short delay
      setTimeout(() => {
        setFiles([]);
      }, 1500);
    } else if (errorCount > 0) {
      setGlobalMessage({
        type: "error",
        text: `${successCount} saved, ${errorCount} failed. Check errors below.`,
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const uploadedCount = files.filter((f) => f.status === "uploaded").length;
  const pendingOrUploadingCount = files.filter((f) => f.status === "pending" || f.status === "uploading").length;

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* CBT Upload Mode Toggle */}
      <CBTUploadToggle 
        enabled={isCbtMode} 
        onToggle={(enabled) => {
          setIsCbtMode(enabled);
          if (enabled) {
            setIsRAG(false);
            setFiles([]); // Clear other files when switching to CBT
            setGlobalMessage(null);
          }
        }} 
      />

      {/* Course Selection */}
      <CourseSelector 
        courses={courses} 
        selectedId={selectedCourseId} 
        onSelect={(id) => {
          setSelectedCourseId(id);
          setCbtSummary(null); // Reset summary when course changes
        }}
        disabled={isRAG && !isCbtMode}
      />

      {isCbtMode ? (
        <div className="space-y-6 animate-in fade-in duration-500">
          <JSONFileInput 
            file={cbtFile} 
            onFileSelect={handleCbtFileSelect} 
            disabled={isSaving}
          />

          {cbtFile && (
            <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Question Bank Resource Details
                </span>
                <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 uppercase">
                  Question Bank
                </span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={cbtTitle}
                    onChange={(e) => {
                      const newTitle = e.target.value;
                      setCbtTitle(newTitle);
                      const newSlug = newTitle
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/^-+|-+$/g, "")
                        .slice(0, 50);
                      setCbtSlug(newSlug);
                    }}
                    placeholder="e.g. STT202 2024 Exam & Past Questions"
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Slug
                  </label>
                  <input
                    type="text"
                    value={cbtSlug}
                    onChange={(e) => setCbtSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ""))}
                    placeholder="e.g. stt202-2024-exam-questions"
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-900 focus:border-primary-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Description <span className="text-neutral-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={cbtDescription}
                    onChange={(e) => setCbtDescription(e.target.value)}
                    placeholder="e.g. Comprehensive past questions with solutions and explanations"
                    rows={2}
                    className="w-full resize-none rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {cbtFile && cbtPreview && (
            <CBTPreview 
              preview={cbtPreview} 
              fileName={cbtFile.name} 
              fileSize={cbtFile.size} 
            />
          )}
          
          {cbtSummary && (
            <UploadSummary 
              summary={cbtSummary} 
              courseCode={courses.find(c => c.id === selectedCourseId)?.code || ""} 
            />
          )}

          <div className="rounded-xl bg-amber-50 p-4 border border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/30">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800 dark:text-amber-400">
                <p className="font-semibold">CBT Mode Requirements</p>
                <ul className="mt-1 list-inside list-disc opacity-80">
                  <li>File must be a valid JSON array</li>
                  <li>Required fields: course_code, question_id, question_text, options, correct_option</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* RAG Dump Toggle */}
      <div className="rounded-lg border border-primary-200 bg-primary-50/50 p-4 dark:border-primary-900/50 dark:bg-primary-900/10">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-sm font-semibold text-primary-900 dark:text-primary-300">
              RAG Storage Mode
            </h3>
            <p className="text-xs text-primary-700 dark:text-primary-400">
              Upload files as generic dumps for AI knowledge. These won&apos;t be visible in any course.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsRAG(!isRAG);
              if (!isRAG) setSelectedCourseId(""); // Clear course if RAG is on
            }}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isRAG ? "bg-primary-600" : "bg-neutral-200 dark:bg-neutral-700"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                isRAG ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Resource Type Info */}
      <div className="rounded-lg bg-neutral-50 p-4 dark:bg-neutral-800/50">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          <span className="font-medium text-neutral-900 dark:text-white">Supported file types:</span>{" "}
          Videos, Audio, PDFs, Images, Text/Code (.txt, .md, .json, .js, .ts) — file type is auto-detected
        </p>
      </div>

      {/* Status Selector */}
      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Publish Status
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setSelectedStatus("published")}
            className={`flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all ${
              selectedStatus === "published"
                ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:border-neutral-600"
            }`}
          >
            <Check className="h-4 w-4" />
            Published
          </button>
          <button
            type="button"
            onClick={() => setSelectedStatus("draft")}
            className={`flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all ${
              selectedStatus === "draft"
                ? "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:border-neutral-600"
            }`}
          >
            <PencilLine className="h-4 w-4" />
            Draft
          </button>
        </div>
      </div>

      {/* File Upload Zone */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Upload Files <span className="text-red-500">*</span>
          </label>
          <button
            type="button"
            onClick={() => setShowPasteModal(!showPasteModal)}
            className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors cursor-pointer"
          >
            <ClipboardPaste className="h-3.5 w-3.5" />
            {showPasteModal ? "Close Paste Box" : "Paste JSON"}
          </button>
        </div>

        {showPasteModal && (
          <div className="mb-4 rounded-xl border border-primary-200 bg-primary-50/40 p-4 dark:border-primary-900/40 dark:bg-primary-950/20 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary-700 dark:text-primary-300 flex items-center gap-1.5">
                <Code2 className="h-4 w-4" />
                Paste Raw JSON to Upload
              </span>
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Will be compiled into a .json file
              </span>
            </div>

            <input
              type="text"
              value={pasteTitle}
              onChange={(e) => setPasteTitle(e.target.value)}
              placeholder="Optional file title / name (e.g. Course Notes or Syllabus)"
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            />

            <textarea
              id="paste-json-global-drop"
              value={pasteText}
              onChange={(e) => {
                setPasteText(e.target.value);
                setPasteError(null);
              }}
              placeholder='{ "title": "...", "content": "..." } or [ { "question": "..." } ]'
              rows={5}
              className="w-full rounded-lg border border-neutral-300 bg-white p-3 font-mono text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            />

            {pasteError && (
              <p className="text-xs font-medium text-red-600 dark:text-red-400">
                {pasteError}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowPasteModal(false);
                  setPasteText("");
                  setPasteTitle("");
                  setPasteError(null);
                }}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!pasteText.trim()}
                onClick={() => compilePastedJsonToFile(pasteText, pasteTitle)}
                className="rounded-lg bg-primary-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-primary-700 disabled:opacity-50 transition-all shadow-sm flex items-center gap-1.5"
              >
                <FileCode className="h-3.5 w-3.5" />
                Compile & Add to Upload
              </button>
            </div>
          </div>
        )}

        <div
          className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
            dragActive
              ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
              : files.length > 0
              ? "border-green-500 bg-green-50/50 dark:bg-green-900/10"
              : "border-neutral-300 hover:border-neutral-400 dark:border-neutral-700 dark:hover:border-neutral-600"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onPaste={handlePaste}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*,audio/*,.pdf,.jpg,.jpeg,.png,.webp,.svg,.gif,.mp4,.webm,.mov,.mp3,.wav,.ogg,.m4a,.txt,.md,.json,.csv,.js,.ts,.py,.tsx,.jsx,application/json,application/pdf"
            onChange={handleFileChange}
            multiple
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            title="Choose files to upload"
          />

          <div className="flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
              <CloudUpload className="h-7 w-7 text-neutral-400" />
            </div>
            <div>
              <p className="font-medium text-neutral-900 dark:text-white">
                {selectedCourseId || isRAG ? "Drag and drop files or paste JSON here" : "Select a course first"}
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {selectedCourseId || isRAG ? "or click to browse • Paste JSON (Ctrl+V) supported" : "Choose a course to enable uploads"}
              </p>
            </div>
            <p className="text-xs text-neutral-400 dark:text-neutral-500">
              Videos, Audio, PDFs, Images, JSON & Docs • Max 100MB per file
            </p>
          </div>
        </div>
      </div>

      {/* File Queue */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-neutral-900 dark:text-white">
              Files ({files.length})
            </h3>
            {uploadedCount > 0 && (
              <span className="text-sm text-green-600 dark:text-green-400">
                {uploadedCount} ready to save
              </span>
            )}
          </div>

          <div className="max-h-80 space-y-2 overflow-y-auto rounded-lg border border-neutral-200 p-3 dark:border-neutral-700">
            {files.map((fileUpload) => (
              <div
                key={fileUpload.id}
                className={`rounded-lg border p-3 ${
                  fileUpload.status === "success"
                    ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20"
                    : fileUpload.status === "error"
                    ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20"
                    : fileUpload.status === "uploading" || fileUpload.status === "saving"
                    ? "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-900/20"
                    : fileUpload.status === "uploaded"
                    ? "border-green-200 bg-green-50/50 dark:border-green-900/50 dark:bg-green-900/10"
                    : "border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Status Icon */}
                  <div className="mt-1 shrink-0">
                    {fileUpload.status === "success" ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : fileUpload.status === "error" ? (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    ) : fileUpload.status === "uploading" || fileUpload.status === "saving" ? (
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    ) : fileUpload.status === "uploaded" ? (
                      <CloudUpload className="h-5 w-5 text-green-500" />
                    ) : fileUpload.type === "image" ? (
                      <ImageIcon className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <FileStack className="h-5 w-5 text-neutral-400" />
                    )}
                  </div>

                  {/* File Info */}
                  <div className="min-w-0 flex-1">
                    {fileUpload.status === "uploaded" || fileUpload.status === "pending" ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={fileUpload.title}
                            onChange={(e) => updateFileTitle(fileUpload.id, e.target.value)}
                            placeholder="Enter title..."
                            className="flex-1 rounded border border-neutral-300 bg-white px-2 py-1 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                          />
                          <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium uppercase ${
                            fileUpload.type === "video"
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              : fileUpload.type === "audio"
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                              : fileUpload.type === "image"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          }`}>
                            {fileUpload.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-neutral-400">Slug:</span>
                          <input
                            type="text"
                            value={fileUpload.slug}
                            onChange={(e) => updateFileSlug(fileUpload.id, e.target.value)}
                            placeholder="url-slug"
                            className="flex-1 rounded border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-900 focus:border-primary-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                          />
                        </div>
                        <textarea
                          value={fileUpload.description}
                          onChange={(e) => updateFileDescription(fileUpload.id, e.target.value)}
                          placeholder="Enter description (optional)..."
                          rows={2}
                          className="w-full resize-none rounded border border-neutral-300 bg-white px-2 py-1 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                        />
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="truncate font-medium text-neutral-900 dark:text-white">
                            {fileUpload.title}
                          </p>
                          <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium uppercase ${
                            fileUpload.type === "video"
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              : fileUpload.type === "audio"
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                              : fileUpload.type === "image"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          }`}>
                            {fileUpload.type}
                          </span>
                        </div>
                        {fileUpload.description && (
                          <p className="mt-0.5 truncate text-xs text-neutral-600 dark:text-neutral-300">
                            {fileUpload.description}
                          </p>
                        )}
                      </div>
                    )}
                    <p className="mt-1 truncate text-xs text-neutral-500 dark:text-neutral-400">
                      {fileUpload.file.name} • {formatFileSize(fileUpload.file.size)}
                    </p>
                    {fileUpload.message && (
                      <p
                        className={`mt-1 text-xs ${
                          fileUpload.status === "success"
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {fileUpload.message}
                      </p>
                    )}

                    {/* Progress Bar */}
                    {(fileUpload.status === "uploading" || fileUpload.status === "pending") && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-blue-600 dark:text-blue-400">
                            {fileUpload.status === "uploading" ? "Uploading..." : "Waiting..."}
                          </span>
                          <span className="font-medium text-blue-600 dark:text-blue-400">{fileUpload.progress}%</span>
                        </div>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-blue-100 dark:bg-blue-900/30">
                          <div
                            className="h-full rounded-full bg-blue-600 transition-all duration-300 ease-out"
                            style={{ width: `${fileUpload.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {fileUpload.status === "saving" && (
                      <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">Saving to database...</p>
                    )}
                  </div>

                  {/* Remove Button */}
                  {(fileUpload.status === "uploaded" || fileUpload.status === "error") && (
                    <button
                      type="button"
                      onClick={() => removeFile(fileUpload.id)}
                      aria-label="Remove file"
                      className="shrink-0 rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-700 dark:hover:text-neutral-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )}

      {/* Save Button */}
      <button
        type="submit"
        disabled={isSaving || (isCbtMode ? !cbtFile : uploadedCount === 0) || pendingOrUploadingCount > 0 || !selectedCourseId}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-4 font-bold text-white shadow-lg shadow-primary-500/25 transition-all hover:bg-primary-700 hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSaving ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            {isCbtMode ? "Processing JSON..." : "Saving..."}
          </>
        ) : (
          <>
            <Check className="h-5 w-5" />
            {isCbtMode ? "Bulk Upload Questions" : `Save ${uploadedCount > 0 ? `${uploadedCount} Resource${uploadedCount > 1 ? "s" : ""}` : "Resources"}`}
          </>
        )}
      </button>

      {/* Global Message */}
      {globalMessage && (
        <div
          ref={messageRef}
          className={`rounded-lg p-4 ${
            globalMessage.type === "success"
              ? "border border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-900/20 dark:text-green-400"
              : "border border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400"
          }`}
        >
          <div className="flex items-start gap-3">
            {globalMessage.type === "success" ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            )}
            <p className="font-medium">{globalMessage.text}</p>
          </div>
        </div>
      )}
    </form>
  );
}
