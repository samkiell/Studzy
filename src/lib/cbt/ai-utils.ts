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

  return `You are an expert tutor. Explain the following question clearly.

Question:
"${question.question_text}"

Options:
${optionsText}

Student's Selected Answer:
"${selectedOption.toUpperCase()}"

Correct Answer:
"${question.correct_option.toUpperCase()}"

Instructions:
1. Confirm if the student's answer is correct or incorrect.
2. Explain clearly WHY the correct answer is correct.
3. Explain WHY the other options (including the student's choice if wrong) are incorrect.
4. Keep the tone encouraging and educational.`;
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
