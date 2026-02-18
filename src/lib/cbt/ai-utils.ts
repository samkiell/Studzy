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
 Explain clearly WHY the correct answer is correct.
 Explain WHY the other options (including the student's choice if wrong) are incorrect.
 Keep the tone encouraging and educational.`;
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
    
    // 1. Send system message with generic persona
    await fetch(`/api/ai/sessions/${session.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: "You are an expert tutor for OAU software engineering students. Your goal is to explain concepts clearly and help students learn from their mistakes.",
        role: "system",
        mode: "chat",
      }),
    });

    // 2. Send user message with full context
    const messageResponse = await fetch(`/api/ai/sessions/${session.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: prompt, // The full question details go here
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
