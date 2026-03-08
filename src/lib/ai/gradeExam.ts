import { GradingQuestion, ExamResult, QuestionResult } from "@/types/grading";
import { gradeChunk } from "./gradeChunk";

/**
 * Orchestrates the full exam grading process.
 * Splits questions into chunks and processes them with controlled concurrency.
 */
export async function gradeExam(
  questions: GradingQuestion[],
  chunkSize = 1, // Defaulting to 1 as per requirements for granular processing
  concurrencyLimit = 3
): Promise<ExamResult> {
  const chunks: GradingQuestion[][] = [];
  for (let i = 0; i < questions.length; i += chunkSize) {
    chunks.push(questions.slice(i, i + chunkSize));
  }

  const allResults: QuestionResult[] = [];
  const activeJobs: Promise<QuestionResult[]>[] = [];
  const queue = [...chunks];

  const processQueue = async () => {
    while (queue.length > 0) {
      if (activeJobs.length < concurrencyLimit) {
        const chunk = queue.shift();
        if (chunk) {
          const job = gradeChunk(chunk).then((results) => {
            allResults.push(...results);
            activeJobs.splice(activeJobs.indexOf(job), 1);
            return results;
          });
          activeJobs.push(job);
        }
      } else {
        await Promise.race(activeJobs);
      }
    }
    await Promise.all(activeJobs);
  };

  await processQueue();

  // Aggregation
  let totalScore = 0;
  let maxScore = 0;
  
  // Sort results to match original question order if needed, but not strictly required
  // Let's sort by ID or keep track of order if necessary.
  // For now, let's just sum up.
  
  for (const result of allResults) {
    totalScore += result.score;
    // We need the maxScore from the original questions
    const q = questions.find(q => q.id === result.questionId);
    if (q) {
      maxScore += q.maxScore;
    }
  }

  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

  return {
    totalScore,
    maxScore,
    percentage: Math.round(percentage * 100) / 100, // 2 decimal places
    questionResults: allResults,
  };
}
