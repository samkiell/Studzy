// ============================================
// Text Cleaning for RAG Chunks
// ============================================

/**
 * Clean raw text extracted from a PDF.
 * Removes noise, normalizes whitespace, and strips artifacts
 * that would degrade embedding quality.
 */
export function cleanText(rawText: string): string {
  let text = rawText;

  // Remove null bytes and other control characters (except newlines/tabs)
  text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // Normalize unicode whitespace characters to regular spaces
  text = text.replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, " ");

  // Remove page numbers (common patterns: "Page 1", "- 1 -", "1 of 10", standalone numbers on a line)
  text = text.replace(/^[\s]*(?:page\s*\d+|\-\s*\d+\s*\-|\d+\s*(?:of|\/)\s*\d+)[\s]*$/gim, "");
  text = text.replace(/^\s*\d{1,4}\s*$/gm, "");

  // Remove common headers/footers (lines that are just "CONFIDENTIAL", dates, etc.)
  text = text.replace(/^\s*(?:confidential|draft|internal use only)\s*$/gim, "");

  // Collapse multiple newlines into double newlines (paragraph breaks)
  text = text.replace(/\n{3,}/g, "\n\n");

  // Collapse multiple spaces into single space
  text = text.replace(/[ \t]{2,}/g, " ");

  // Remove leading/trailing whitespace per line
  text = text
    .split("\n")
    .map((line) => line.trim())
    .join("\n");

  // Remove leading/trailing whitespace from the whole text
  text = text.trim();

  return text;
}

/**
 * Check if text has enough meaningful content to be worth embedding.
 * Filters out empty or near-empty extractions.
 */
export function hasSubstantialContent(text: string, minWords: number = 20): boolean {
  const wordCount = text.split(/\s+/).filter((w) => w.length > 0).length;
  return wordCount >= minWords;
}
