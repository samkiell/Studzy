import { gradeExam } from "../lib/ai/gradeExam";
import { GradingQuestion } from "../types/grading";

// Load environment variables for local testing
import * as fs from 'fs';
import * as path from 'path';

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^['"](.*)['"]$/, '$1');
        process.env[key] = value;
      }
    });
  }
}

loadEnv();

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

testGrading();
