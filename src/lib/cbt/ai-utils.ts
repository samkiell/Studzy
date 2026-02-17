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

  return `Explain this CSC201 (Introduction to Python Programming) question.

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
  const title = `Intro to Python: ${question.question_text.substring(0, 30)}...`;

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
    
    // 1. Send system message with context
    await fetch(`/api/ai/sessions/${session.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: prompt,
        role: "system",
        mode: "chat",
      }),
    });

    // 2. Send user message (short)
    const messageResponse = await fetch(`/api/ai/sessions/${session.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: "Explain this question.",
        role: "user",
        mode: "chat",
      }),
    });

    if (!messageResponse.ok) {
      console.warn("Failed to send initial AI prompt, session created though.");
    }

    return {
      sessionId: session.id,
    };
  } catch (error) {
    console.error("Error in createExplanationSession:", error);
    throw error;
  }
}
