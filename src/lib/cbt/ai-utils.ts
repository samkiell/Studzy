import { Question, isTheoryQuestion } from "@/types/cbt";

/**
 * Generates the prompt for AI explanation of an MCQ question.
 */
function generateMcqExplanationPrompt(
  question: Question,
  selectedOption: string
): string {
  const optionsText = Object.entries(question.options)
    .map(([key, val]) => `${key.toUpperCase()}: ${val}`)
    .join("\n");

  return `You are an expert tutor. Explain the following question clearly.
  KEEP IT VERY SHORT AND BRIEF. Max 2-3 sentences per section.

Question:
"${question.question_text}"

Options:
${optionsText}

Student's Selected Answer:
"${selectedOption?.toUpperCase() || 'N/A'}"

Correct Answer:
"${question.correct_option?.toUpperCase() || 'N/A'}"
 Explain clearly WHY the correct answer is correct.
 Explain WHY the other options are incorrect.
 Keep the tone encouraging and brief.`;
}

/**
 * Generates the prompt for AI explanation of a theory question.
 */
function generateTheoryExplanationPrompt(
  question: Question,
  _selectedOption: string
): string {
  const subQuestionsText = question.sub_questions
    ? question.sub_questions
        .map((sq) => `  ${sq.label}) ${sq.content}`)
        .join("\n")
    : "";

  const keyPointsText = question.key_points
    ? question.key_points.map((kp, i) => `  ${i + 1}. ${kp}`).join("\n")
    : "";

  return `You are an expert academic tutor helping a student understand a theory exam question.

Question:
"${question.question_text}"
${subQuestionsText ? `\nSub-questions:\n${subQuestionsText}` : ""}
${question.model_answer ? `\nModel Answer:\n"${question.model_answer}"` : ""}
${keyPointsText ? `\nKey Points to address:\n${keyPointsText}` : ""}
${question.rubric ? `\nMarking rubric:\n${question.rubric}` : ""}

Please:
1. Provide a clear, structured answer to this question covering all key points.
2. Explain the reasoning behind each point.
3. Give tips on how to structure a strong answer for this type of question.
4. Keep the tone encouraging and educational.`;
}

/**
 * Generates the correct prompt based on question type.
 */
export function generateExplanationPrompt(
  question: Question,
  selectedOption: string
): string {
  if (isTheoryQuestion(question)) {
    return generateTheoryExplanationPrompt(question, selectedOption);
  }
  return generateMcqExplanationPrompt(question, selectedOption);
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
  const isTheory = isTheoryQuestion(question);
  const title = isTheory
    ? `Theory: ${question.question_text.substring(0, 30)}...`
    : `MCQ: ${question.question_text.substring(0, 30)}...`;

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
    
    // 1. Send system message with persona
    await fetch(`/api/ai/sessions/${session.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: isTheory
          ? "You are an expert academic tutor for OAU software engineering students. Help students understand theory concepts, structure strong answers, and learn from model solutions."
          : "You are an expert tutor for OAU software engineering students. Your goal is to explain concepts clearly and help students learn from their mistakes.",
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
