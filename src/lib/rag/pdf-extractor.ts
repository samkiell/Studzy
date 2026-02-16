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

  // Import pdf-parse v2 (class-based API)
  const { PDFParse } = await import("pdf-parse");

  const parser = new PDFParse({ data: buffer });
  const pdfData = await parser.getText();
  const info = await parser.getInfo();
  await parser.destroy();

  const fileName = filePath.split("/").pop() || filePath;

  return {
    text: pdfData.text,
    pageCount: info.numPages || 0,
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
