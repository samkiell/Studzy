import { isTheoryQuestion } from "@/types/cbt";
import type { Question, QuizResult, QuizSubmittedAnswer, QuestionResult } from "@/lib/cbt/quizScorer";

export function scoreLocalQuiz({
  questions,
  answers,
  durationSeconds,
  questionDurations,
}: {
  questions: Question[];
  answers: QuizSubmittedAnswer[];
  durationSeconds: number;
  questionDurations: Record<string, number>;
}): QuizResult {
  const completedAt = new Date().toISOString();

  let totalScore = 0;
  let totalMaxScore = 0;
  const topicStats: Record<string, { correct: number; total: number; avgTime: number }> = {};
  const questionsWithAnswers: QuestionResult[] = [];

  for (const question of questions) {
    const ans = answers.find((a) => a.question_id === question.id);
    const isTheory = isTheoryQuestion(question);
    const topic = question.topic || "General";
    const marks = question.marks ?? (isTheory ? 10 : 1);

    if (!topicStats[topic]) topicStats[topic] = { correct: 0, total: 0, avgTime: 0 };
    topicStats[topic].total++;
    totalMaxScore += marks;

    if (!ans) {
      questionsWithAnswers.push({
        question_id: question.id,
        question_text: question.question_text,
        topic: question.topic,
        difficulty: question.difficulty || null,
        options: question.options || {},
        correct_option: question.correct_option,
        selected_option: null,
        is_correct: false,
        duration_seconds: 0,
        explanation: question.explanation,
        ai_feedback: null,
        theory_answer: null,
      });
      continue;
    }

    topicStats[topic].avgTime += ans.duration_seconds;

    let isCorrect = false;
    let aiFeedback: QuestionResult["ai_feedback"] = null;

    if (isTheory) {
      const studentText = [ans.theory_answer, ans.theory_sub_answers && Object.values(ans.theory_sub_answers).filter(Boolean).join("\n\n")]
        .filter(Boolean)
        .join("\n\n");

      if (studentText?.trim()) {
        aiFeedback = {
          score: 0,
          max_marks: marks,
          strengths: [],
          weaknesses: ["AI grading is unavailable in offline mode."],
          improvement: "Connect to the internet to enable AI-powered theory grading.",
        };
      } else {
        aiFeedback = { score: 0, max_marks: marks, strengths: [], weaknesses: ["No answer was submitted."], improvement: "" };
      }
    } else {
      isCorrect = question.correct_option === ans.selected_option;
      if (isCorrect) {
        totalScore++;
        topicStats[topic].correct++;
      }
    }

    questionsWithAnswers.push({
      question_id: question.id,
      question_text: question.question_text,
      topic: question.topic,
      difficulty: question.difficulty || null,
      options: question.options || {},
      correct_option: question.correct_option,
      selected_option: ans.selected_option,
      is_correct: isCorrect,
      duration_seconds: ans.duration_seconds,
      explanation: question.explanation,
      ai_feedback: aiFeedback,
      theory_answer: isTheory ? (ans.theory_answer || Object.values(ans.theory_sub_answers || {}).filter(Boolean).join("\n\n") || null) : null,
    });
  }

  Object.values(topicStats).forEach((stats) => {
    stats.avgTime = stats.total > 0 ? Math.round(stats.avgTime / stats.total) : 0;
  });

  return {
    score: totalScore,
    totalQuestions: questions.length,
    completedAt,
    topicStats,
    questionsWithAnswers,
  };
}
