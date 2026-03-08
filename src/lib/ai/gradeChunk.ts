import { GradingQuestion, QuestionResult } from "@/types/grading";
import { gradeSingleQuestion } from "./gradeSingleQuestion";

/**
 * Grades a chunk of questions. 
 * For now, we process questions sequentially within a chunk to keep it simple,
 * but the orchestrator (gradeExam) will handle concurrency across chunks.
 */
export async function gradeChunk(
  questions: GradingQuestion[]
): Promise<QuestionResult[]> {
  const results: QuestionResult[] = [];

  for (const question of questions) {
    const grading = await gradeSingleQuestion(question);
    results.push({
      questionId: question.id,
      score: grading.score,
      feedback: grading.feedback,
      strengths: grading.strengths,
      weaknesses: grading.weaknesses,
    });
  }

  return results;
}
