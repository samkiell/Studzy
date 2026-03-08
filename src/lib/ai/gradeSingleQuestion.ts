import { GradingQuestion, AIGradingResponse } from "@/types/grading";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-1.5-flash"; // More generous quotas than 2.5-flash-exp

export async function gradeSingleQuestion(
  question: GradingQuestion,
  retryCount = 1
): Promise<AIGradingResponse> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

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

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const executeRequest = async (): Promise<AIGradingResponse> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!content) {
        throw new Error("Empty response from Gemini API");
      }

      const parsed: AIGradingResponse = JSON.parse(content);
      
      // Validation and clamping
      parsed.score = Math.max(0, Math.min(parsed.score, question.maxScore));
      if (!parsed.feedback) parsed.feedback = "No feedback provided.";
      
      return parsed;
    } catch (error: any) {
      if (error.name === "AbortError") {
        throw new Error("Gemini API request timed out after 30 seconds");
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  try {
    return await executeRequest();
  } catch (error) {
    if (retryCount > 0) {
      console.warn(`Grading failed for question ${question.id}, retrying...`, error);
      return gradeSingleQuestion(question, retryCount - 1);
    }
    console.error(`Grading failed for question ${question.id} after retries.`, error);
    return {
      score: 0,
      feedback: "Failed to grade this question due to an AI service error.",
      strengths: [],
      weaknesses: ["System error during grading."]
    };
  }
}
