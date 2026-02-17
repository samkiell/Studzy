import { Question } from "@/types/cbt";

/**
 * Generates the prompt for AI explanation of a CSC201 question.
 */
export function generateExplanationPrompt(
  question: Question,
  selectedOption: string
): string {
  const optionsText = Object.entries(question.options)
    .map(([key, val]) => `${key.toUpperCase()}: ${val}`)
    .join("\n");

  return `Explain this CSC201 question.

Question:
${question.question_text}

Options:
${optionsText}

Student selected:
${selectedOption.toUpperCase()}

Correct answer:
${question.correct_option.toUpperCase()}

Explain clearly:
1. Why the selected answer is correct or incorrect.
2. Why the correct answer is correct.
3. Why other options are wrong.

Use a helpful, educational tone.`;
}

/**
 * Creates a new AI chat session for a CBT explanation.
 * This should be called from the client side using the existing /api/ai/sessions endpoint.
 */
export async function createExplanationSession(
  question: Question,
  selectedOption: string
) {
  const prompt = generateExplanationPrompt(question, selectedOption);
  const title = `CSC201: ${question.question_text.substring(0, 30)}...`;

  try {
    // We call our internal API to create a session
    const response = await fetch("/api/ai/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });

    if (!response.ok) {
      throw new Error("Failed to create chat session");
    }

    const { session } = await response.json();
    
    // Return both the session ID and the prompt to be sent as the first message
    return {
      sessionId: session.id,
      prompt,
    };
  } catch (error) {
    console.error("Error in createExplanationSession:", error);
    throw error;
  }
}
