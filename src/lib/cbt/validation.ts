import { CBTQuestion, Difficulty, QuestionType } from "@/types/cbt";

/**
 * Detects whether a raw question object is MCQ or Theory.
 * Theory: options is empty/missing AND correct_option is null/empty.
 * MCQ: options has entries.
 */
function detectQuestionType(question: any): QuestionType {
  const opts = question.options;
  const hasOptions =
    opts &&
    typeof opts === "object" &&
    !Array.isArray(opts) &&
    Object.keys(opts).length > 0;

  // Also handle array-style options (empty array = theory)
  const isEmptyArray = Array.isArray(opts) && opts.length === 0;

  if (!hasOptions || isEmptyArray) {
    return "theory";
  }

  return "mcq";
}

/**
 * Validates a single question from a CBT JSON upload.
 * Supports both MCQ and Theory question types.
 * Throws a descriptive error if validation fails.
 */
export function validateCBTQuestion(
  question: any,
  index: number,
  defaultCourseCode?: string
): CBTQuestion {
  if (typeof question !== "object" || question === null) {
    throw new Error("Invalid question format: must be an object");
  }

  const { topic, question_text, explanation } = question;

  // Use provided course_code or fallback to default
  const course_code = question.course_code || defaultCourseCode;

  // Robust question_id parsing
  let question_id =
    question.question_id ?? question.id ?? question.questionId ?? question.Id;

  if (typeof question_id === "string") {
    const parsed = parseInt(question_id, 10);
    if (!isNaN(parsed)) {
      question_id = parsed;
    }
  }

  // Final fallback to index if still not a valid number
  if (
    question_id === undefined ||
    question_id === null ||
    typeof question_id !== "number" ||
    isNaN(question_id)
  ) {
    question_id = index + 1;
  }

  // Set default difficulty
  const difficulty: Difficulty = "medium";

  // Required field checks (shared)
  if (!course_code) throw new Error("Missing 'course_code'");
  if (!question_text)
    throw new Error(`Missing 'question_text' at ID ${question_id}`);

  // Detect question type
  const question_type = detectQuestionType(question);

  if (question_type === "mcq") {
    // ── MCQ VALIDATION ──────────────────────────────────────────
    const { options } = question;

    let correct_option = question.correct_option;
    if (typeof correct_option === "string") {
      correct_option = correct_option.toUpperCase();
    }

    if (!options || typeof options !== "object")
      throw new Error(`Missing or invalid 'options' at ID ${question_id}`);
    if (!correct_option)
      throw new Error(`Missing 'correct_option' at ID ${question_id}`);

    // Options content checks (at least A, B, C, D)
    const requiredOptions = ["A", "B", "C", "D"];
    for (const opt of requiredOptions) {
      if (
        options[opt] === undefined &&
        options[opt.toLowerCase()] === undefined
      ) {
        throw new Error(
          `Missing required option '${opt}' at ID ${question_id}`
        );
      }
    }

    // Normalize options keys to uppercase
    const normalizedOptions: Record<string, string> = {};
    Object.entries(options as Record<string, string>).forEach(
      ([key, value]) => {
        normalizedOptions[key.toUpperCase()] = value;
      }
    );

    if (normalizedOptions[correct_option] === undefined) {
      throw new Error(
        `Correct option '${correct_option}' not found in options at ID ${question_id}`
      );
    }

    return {
      course_code,
      question_id,
      difficulty: difficulty as Difficulty,
      topic: topic || null,
      question_text,
      question_type: "mcq",
      options: normalizedOptions as {
        A: string;
        B: string;
        C: string;
        D: string;
        [key: string]: string;
      },
      correct_option,
      explanation: explanation || null,
    };
  } else {
    // ── THEORY VALIDATION ───────────────────────────────────────
    // Theory questions: model_answer is recommended but not strictly required for upload
    const model_answer = question.model_answer || null;
    const key_points = Array.isArray(question.key_points)
      ? question.key_points
      : null;
    const rubric = question.rubric || null;

    // Validate sub_questions format if present
    let sub_questions: { label: string; content: string }[] | null = null;
    if (Array.isArray(question.sub_questions)) {
      sub_questions = question.sub_questions.map(
        (sq: any, sqIdx: number) => {
          if (!sq.label)
            throw new Error(
              `Missing 'label' in sub_question ${sqIdx + 1} at ID ${question_id}`
            );
          if (!sq.content)
            throw new Error(
              `Missing 'content' in sub_question ${sqIdx + 1} at ID ${question_id}`
            );
          return { label: sq.label, content: sq.content };
        }
      );
    }

    return {
      course_code,
      question_id,
      difficulty: difficulty as Difficulty,
      topic: topic || null,
      question_text,
      question_type: "theory",
      options: {},
      correct_option: null,
      explanation: explanation || null,
      model_answer,
      key_points,
      rubric,
      sub_questions,
    };
  }
}

/**
 * General validator for the entire CBT JSON array.
 * Supports mixed MCQ and Theory questions.
 */
export function validateCBTQuestionList(
  data: unknown,
  defaultCourseCode?: string
): CBTQuestion[] {
  if (!Array.isArray(data)) {
    throw new Error("CBT data must be an array of questions");
  }

  return data.map((item, index) => {
    try {
      return validateCBTQuestion(item, index, defaultCourseCode);
    } catch (err: any) {
      throw new Error(`Item at index ${index}: ${err.message}`);
    }
  });
}
