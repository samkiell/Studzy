import { GradingQuestion, AIGradingResponse } from "@/types/grading";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.0-flash";

export async function gradeSingleQuestion(
  question: GradingQuestion,
  retryCount = 1
): Promise<AIGradingResponse> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

  const prompt = `
You are an academic examiner. Grade the student answer strictly based on the question and max score provided.
Return a structured JSON response.

Question: "${question.question}"
Student Answer: "${question.answer}"
Max Score: ${question.maxScore}

Grading Instructions:
- Evaluate the accuracy and completeness of the answer.
- Provide constructive feedback.
- Return only valid JSON.

Response Structure:
{
  "score": number,
  "feedback": "string",
  "strengths": ["string"],
  "weaknesses": ["string"]
}

IMPORTANT: The score must be between 0 and ${question.maxScore}.
`;

  const executeRequest = async (): Promise<AIGradingResponse> => {
    try {
      const model = genAI.getGenerativeModel({ 
        model: GEMINI_MODEL,
        generationConfig: { 
          responseMimeType: "application/json"
        }
      });

      const response = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      const content = response.response.text();
      if (!content) {
        throw new Error("Empty response from Gemini API");
      }

      const parsed: AIGradingResponse = JSON.parse(content);
      
      // Validation and clamping
      parsed.score = Math.max(0, Math.min(parsed.score, question.maxScore));
      if (!parsed.feedback) parsed.feedback = "No feedback provided.";
      
      return parsed;
    } catch (error: any) {
      throw error;
    }
  };

  try {
    return await executeRequest();
  } catch (error: any) {
    // Check for rate limiters or transient errors
    const isRateLimit = error.message?.includes("429") || error.message?.includes("Quota exceeded");
    
    if (retryCount > 0) {
      const delay = isRateLimit ? 2000 : 500; // Wait longer if rate limited
      console.warn(`Grading failed for question ${question.id}, retrying in ${delay}ms...`, error.message);
      await new Promise(resolve => setTimeout(resolve, delay));
      return gradeSingleQuestion(question, retryCount - 1);
    }
    
    console.error(`Grading failed for question ${question.id} after retries.`, error.message);
    return {
      score: 0,
      feedback: "Failed to grade this question due to an AI service error.",
      strengths: [],
      weaknesses: ["System error during grading."]
    };
  }
}
