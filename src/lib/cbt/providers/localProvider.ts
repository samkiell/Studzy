import { Question } from "@/types/cbt";
import cis214Raw from "./data/cis214.json";

type RawQuestion = {
  id: string;
  topic: string;
  question_text: string;
  difficulty: "easy" | "medium" | "hard";
  options: Record<string, string>;
  correct_option: string | null;
  explanation: string | null;
  course_id: string;
  question_id: number;
  created_at: string;
};

const banks: Record<string, RawQuestion[]> = {
  CIS214: cis214Raw as RawQuestion[],
};

function toQuestion(raw: RawQuestion): Question {
  return {
    id: raw.id,
    course_id: raw.course_id,
    question_id: raw.question_id,
    difficulty: raw.difficulty,
    topic: raw.topic || null,
    question_text: raw.question_text,
    options: raw.options,
    correct_option: raw.correct_option,
    explanation: raw.explanation,
    created_at: raw.created_at,
  };
}

export const localProvider = {
  getQuestions(courseId: string): Question[] {
    const raw = banks[courseId.toUpperCase()];
    if (!raw) return [];
    return raw.map(toQuestion);
  },

  getExamMetadata(courseId: string) {
    const questions = this.getQuestions(courseId);
    const topicCounts: Record<string, number> = {};
    const difficultyCounts: Record<string, number> = {};
    let hasTheoryQuestions = false;

    questions.forEach((q) => {
      const t = q.topic || "General";
      topicCounts[t] = (topicCounts[t] || 0) + 1;
      const d = q.difficulty || "medium";
      difficultyCounts[d] = (difficultyCounts[d] || 0) + 1;
    });

    return {
      topics: Object.entries(topicCounts).map(([name, count]) => ({ name, count })),
      totalQuestions: questions.length,
      hasTheoryQuestions,
      difficulties: Object.entries(difficultyCounts).map(([name, count]) => ({ name, count })),
    };
  },

  getTopics(courseId: string): string[] {
    const questions = this.getQuestions(courseId);
    const topics = new Set(questions.map((q) => q.topic || "General"));
    return Array.from(topics);
  },

  getFilteredQuestions(courseId: string, filters: { topic?: string; difficulty?: string; count?: number }): Question[] {
    let questions = this.getQuestions(courseId);

    if (filters.topic && filters.topic !== "all") {
      questions = questions.filter((q) => (q.topic || "General") === filters.topic);
    }

    if (filters.difficulty && filters.difficulty !== "all") {
      questions = questions.filter((q) => q.difficulty === filters.difficulty);
    }

    const shuffled = [...questions].sort(() => Math.random() - 0.5);

    if (filters.count && filters.count > 0) {
      return shuffled.slice(0, Math.min(filters.count, shuffled.length));
    }

    return shuffled;
  },
};
