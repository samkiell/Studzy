import { CBTQuestion, Difficulty } from "@/types/cbt";

/**
 * Validates a single question from a CBT JSON upload.
 * Throws a descriptive error if validation fails.
 */
export function validateCBTQuestion(question: any): CBTQuestion {
  if (typeof question !== "object" || question === null) {
    throw new Error("Invalid question format: must be an object");
  }

  const {
    course_code,
    question_id,
    difficulty,
    topic,
    question_text,
    options,
    correct_option,
    explanation,
  } = question;

  // Required Field Checks
  if (!course_code) throw new Error(`Missing 'course_code' at ID ${question_id || 'unknown'}`);
  if (typeof question_id !== 'number') throw new Error(`'question_id' must be a number at ID ${question_id || 'unknown'}`);
  if (!question_text) throw new Error(`Missing 'question_text' at ID ${question_id}`);
  if (!options || typeof options !== 'object') throw new Error(`Missing or invalid 'options' at ID ${question_id}`);
  if (!correct_option) throw new Error(`Missing 'correct_option' at ID ${question_id}`);

  // Difficulty Check
  const validDifficulties: Difficulty[] = ['easy', 'medium', 'hard'];
  if (!validDifficulties.includes(difficulty)) {
    throw new Error(`Invalid difficulty '${difficulty}' at ID ${question_id}. Must be easy, medium, or hard.`);
  }

  // Options Content Checks (Ensure at least A, B, C, D exist as per prompt)
  const requiredOptions = ['A', 'B', 'C', 'D'];
  for (const opt of requiredOptions) {
    if (options[opt] === undefined) {
      throw new Error(`Missing required option '${opt}' at ID ${question_id}`);
    }
  }

  // Correct Option Existence Check
  if (options[correct_option] === undefined) {
    throw new Error(`Correct option '${correct_option}' not found in options at ID ${question_id}`);
  }

  return {
    course_code,
    question_id,
    difficulty,
    topic: topic || null,
    question_text,
    options,
    correct_option,
    explanation: explanation || null,
  };
}

/**
 * General validator for the entire CBT JSON array.
 */
export function validateCBTQuestionList(data: unknown): CBTQuestion[] {
  if (!Array.isArray(data)) {
    throw new Error("CBT data must be an array of questions");
  }

  return data.map((item, index) => {
    try {
      return validateCBTQuestion(item);
    } catch (err: any) {
      throw new Error(`Item at index ${index}: ${err.message}`);
    }
  });
}
