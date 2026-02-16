// ============================================
// Text Extraction from Supabase Storage
// ============================================

import { createAdminClient } from "@/lib/supabase/admin";
import { STORAGE_BUCKET } from "./config";

interface ExtractedText {
  text: string;
  pageCount: number; // Text files don't have pages, so defaults to 1
  fileName: string;
}

/**
 * Fetch a text-based file (txt, md, json, csv, etc.) from Supabase Storage.
 */
export async function extractTextFromStorage(
  filePath: string
): Promise<ExtractedText> {
  const supabase = createAdminClient();

  // Download the file directly via the admin client
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .download(filePath);

  if (error) {
    throw new Error(`Failed to download file from storage: ${error.message}`);
  }

  if (!data) {
    throw new Error(`No data returned for file: ${filePath}`);
  }

  // Convert Blob to text
  const text = await data.text();

  if (text.length === 0) {
    throw new Error(`Downloaded file is empty: ${filePath}`);
  }

  const fileName = filePath.split("/").pop() || filePath;

  return {
    text,
    pageCount: 1, // Treat as single page
    fileName,
  };
}
