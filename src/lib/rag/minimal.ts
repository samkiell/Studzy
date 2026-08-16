import { GoogleGenerativeAI } from "@google/generative-ai";
import { queryRAG } from "./query";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function runRAG(query: string, options: { topK?: number; threshold?: number } = {}) {
  return await queryRAG({
    question: query,
    topK: options.topK,
    threshold: options.threshold,
  });
}

export async function queryAgent(query: string) {
  try {
    return await runRAG(query);
  } catch (err) {
    console.error("[queryAgent] Failed:", err);
    return { 
      answer: "Something went wrong while retrieving information. Please try again later.", 
      sources: [] 
    };
  }
}
