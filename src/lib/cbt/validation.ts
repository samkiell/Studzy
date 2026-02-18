import { CBTQuestion, Difficulty } from "@/types/cbt";

/**
 * Validates a single question from a CBT JSON upload.
 * Throws a descriptive error if validation fails.
 */
export function validateCBTQuestion(question: any, defaultCourseCode?: string): CBTQuestion {
  if (typeof question !== "object" || question === null) {
    throw new Error("Invalid question format: must be an object");
  }

  const {
    question_id,
    topic,
    question_text,
    options,
    correct_option,
    explanation,
  } = question;

  // Use provided course_code or fallback to default
  const course_code = question.course_code || defaultCourseCode;

  // Provide a default difficulty if missing or invalid
  const validDifficulties: Difficulty[] = ['easy', 'medium', 'hard'];
  let difficulty = question.difficulty;
  if (!validDifficulties.includes(difficulty)) {
    difficulty = 'medium';
  }

  // Required Field Checks
  if (!course_code) throw new Error(`Missing 'course_code' at ID ${question_id || 'unknown'}`);
  if (typeof question_id !== 'number') throw new Error(`'question_id' must be a number at ID ${question_id || 'unknown'}`);
  if (!question_text) throw new Error(`Missing 'question_text' at ID ${question_id}`);
  if (!options || typeof options !== 'object') throw new Error(`Missing or invalid 'options' at ID ${question_id}`);
  if (!correct_option) throw new Error(`Missing 'correct_option' at ID ${question_id}`);

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
    difficulty: difficulty as Difficulty,
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
export function validateCBTQuestionList(data: unknown, defaultCourseCode?: string): CBTQuestion[] {
  if (!Array.isArray(data)) {
    throw new Error("CBT data must be an array of questions");
  }

  return data.map((item, index) => {
    try {
      return validateCBTQuestion(item, defaultCourseCode);
    } catch (err: any) {
      throw new Error(`Item at index ${index}: ${err.message}`);
    }
  });
}
