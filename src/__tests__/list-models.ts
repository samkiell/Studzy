import { GoogleGenerativeAI } from "@google/generative-ai";

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY not set");
    return;
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  try {
    // Note: There isn't a direct listModels in the SDK for clients usually, 
    // but we can try to hit the endpoint manually or check the documentation.
    // Actually, let's just try the most common stable name: 'gemini-1.5-flash' with v1.
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
    const data = await response.json();
    console.log("Available Models:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error listing models:", error);
  }
}

listModels();
