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

  if (filePath.endsWith(".json")) {
    try {
      const jsonData = JSON.parse(text);
      
      // Check if it matches the Devcore_group schema (list of messages with sender/message)
      if (Array.isArray(jsonData) && jsonData.length > 0 && "sender" in jsonData[0] && "message" in jsonData[0]) {
        console.log(`[RAG] Detected chat log JSON format. Converting to transcript...`);
        
        // Filter out system messages and format as transcript
        const transcript = jsonData
          .filter((msg: any) => !msg.is_system && msg.message) // Exclude system messages & empty
          .map((msg: any) => {
            const time = msg.timestamp ? `[${msg.timestamp}] ` : "";
            const sender = msg.sender || "Unknown";
            return `${time}${sender}: ${msg.message}`;
          })
          .join("\n\n");

        return {
          text: transcript,
          pageCount: 1,
          fileName,
        };
      }
    } catch (e) {
      console.warn(`[RAG] Failed to parse JSON for special handling, treating as raw text:`, e);
    }
  }

  return {
    text,
    pageCount: 1, // Treat as single page
    fileName,
  };
}
