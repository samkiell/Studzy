// ============================================
// PDF Text Extraction from Supabase Storage
// ============================================

import { createAdminClient } from "@/lib/supabase/admin";
import { STORAGE_BUCKET } from "./config";

interface ExtractedPDF {
  text: string;
  pageCount: number;
  fileName: string;
}

/**
 * Fetch a PDF from Supabase Storage and extract its text content.
 *
 * - Uses the admin client (service role) so it works for both public and private buckets.
 * - For private buckets, it generates a signed URL automatically.
 * - Downloads as ArrayBuffer to avoid string encoding issues with binary data.
 */
export async function extractPDFFromStorage(
  filePath: string
): Promise<ExtractedPDF> {
  const supabase = createAdminClient();

  // Download the file directly via the admin client
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .download(filePath);

  if (error) {
    throw new Error(`Failed to download PDF from storage: ${error.message}`);
  }

  if (!data) {
    throw new Error(`No data returned for file: ${filePath}`);
  }

  // Convert Blob to Buffer for pdf-parse
  const arrayBuffer = await data.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (buffer.length === 0) {
    throw new Error(`Downloaded file is empty: ${filePath}`);
  }

  // pdf-parse v1: require from lib to bypass test-file-on-load bug in index.js
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse/lib/pdf-parse.js");

  const pdfData = await pdfParse(buffer);

  const fileName = filePath.split("/").pop() || filePath;

  return {
    text: pdfData.text,
    pageCount: pdfData.numpages,
    fileName,
  };
}

/**
 * Generate a public URL for a file in Supabase Storage.
 * Useful for logging / debugging.
 */
export function getPublicUrl(filePath: string): string {
  const supabase = createAdminClient();
  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(filePath);
  return data.publicUrl;
}

/**
 * Generate a signed URL for private bucket access.
 * Valid for 1 hour (3600 seconds).
 */
export async function getSignedUrl(filePath: string): Promise<string> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(filePath, 3600);

  if (error) {
    throw new Error(`Failed to create signed URL: ${error.message}`);
  }

  return data.signedUrl;
}
