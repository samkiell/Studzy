import { gradeExam } from "../src/lib/ai/gradeExam";
import { GradingQuestion } from "../src/types/grading";

// Mock environment variables would be needed if running outside Next.js
// This script is for reference and manual execution verification ideas.

async function testGrading() {
  console.log("🚀 Starting AI Grading Pipeline Test...");

  const mockQuestions: GradingQuestion[] = [
    {
      id: "q1",
      question: "What is photosynthesis?",
      answer: "The process by which plants makes food using sunlight.",
      maxScore: 10,
    },
    {
      id: "q2",
      question: "Define Mitochondria.",
      answer: "The powerhouse of the cell.",
      maxScore: 5,
    },
    {
      id: "q3",
      question: "What is the capital of France?",
      answer: "Paris.",
      maxScore: 2,
    }
  ];

  console.log(`Processing ${mockQuestions.length} questions in chunks...`);
  
  try {
    const result = await gradeExam(mockQuestions, 1, 3);
    
    console.log("✅ Grading Complete!");
    console.log("----------------------------");
    console.log(`Total Score: ${result.totalScore} / ${result.maxScore}`);
    console.log(`Percentage: ${result.percentage}%`);
    console.log("----------------------------");
    
    result.questionResults.forEach((q, i) => {
      console.log(`Question ${i + 1} (${q.questionId}):`);
      console.log(`  Score: ${q.score}`);
      console.log(`  Feedback: ${q.feedback}`);
    });

  } catch (error) {
    console.error("❌ Grading Test Failed:", error);
  }
}

// Note: To run this, you'd need a local execution environment with GEMINI_API_KEY
// For now, I'll provide the logic and verify the code structure.
// testGrading();
