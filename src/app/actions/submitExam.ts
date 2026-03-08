"use server";

import { createClient } from "@/lib/supabase/server";
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
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  try {
    // 1. Run the AI grading pipeline
    const gradingResult: ExamResult = await gradeExam(questions);

    // 2. Store results in Supabase
    const { data, error: insertError } = await supabase
      .from("exam_results")
      .insert({
        exam_id: examId,
        user_id: user.id,
        total_score: gradingResult.totalScore,
        max_score: gradingResult.maxScore,
        percentage: gradingResult.percentage,
        results_json: gradingResult, // Store the full hydrated result
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to store exam results:", insertError);
      throw new Error(`Database error: ${insertError.message}`);
    }

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
