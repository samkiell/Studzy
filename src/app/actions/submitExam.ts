"use server";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { examResults } from "@/lib/db/schema/theory";
import { GradingQuestion, ExamResult } from "@/types/grading";
import { gradeExam } from "@/lib/ai/gradeExam";

/**
 * Server Action to submit an exam for grading.
 */
export async function submitExam({
  examId,
  questions,
}: {
  examId: string;
  questions: GradingQuestion[];
}) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  try {
    // 1. Run the AI grading pipeline
    const gradingResult: ExamResult = await gradeExam(questions);

    // 2. Store results in Neon via Drizzle
    const [data] = await db
      .insert(examResults)
      .values({
        exam_id: examId,
        user_id: user.id,
        total_score: String(gradingResult.totalScore),
        max_score: String(gradingResult.maxScore),
        percentage: String(gradingResult.percentage),
        results_json: gradingResult,
      })
      .returning();

    return {
      success: true,
      data: {
        id: data.id,
        ...gradingResult,
      },
    };
  } catch (error: any) {
    console.error("Exam submission failed:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred during grading.",
    };
  }
}
