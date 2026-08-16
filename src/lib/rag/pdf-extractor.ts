// ============================================
// PDF Text Extraction from Filebase S3 Storage
// ============================================

import { getFile, getPublicUrl as getStoragePublicUrl, getPresignedUrl } from "@/lib/storage";

interface ExtractedPDF {
  text: string;
  pageCount: number;
  fileName: string;
}

/**
 * Fetch a PDF from Filebase Storage and extract its text content.
 */
export async function extractPDFFromStorage(
  filePath: string
): Promise<ExtractedPDF> {
  const response = await getFile(filePath);

  if (!response.Body) {
    throw new Error(`No data returned for file: ${filePath}`);
  }

  // Convert S3 stream/body to Buffer for pdf-parse
  const bytes = await response.Body.transformToByteArray();
  const buffer = Buffer.from(bytes);

  if (buffer.length === 0) {
    throw new Error(`Downloaded file is empty: ${filePath}`);
  }

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

export function getPublicUrl(filePath: string): string {
  return getStoragePublicUrl(filePath);
}

export async function getSignedUrl(filePath: string): Promise<string> {
  return getPresignedUrl(filePath, 3600);
}
