"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import CbtInterface from "@/components/cbt/CbtInterface";
import { Question, Attempt } from "@/types/cbt";
import { localProvider } from "@/lib/cbt/providers/localProvider";
import { submitPublicCbtAttempt } from "../actions";

function getPublicAttemptFromStorage(attemptId: string, courseId: string): any | null {
  if (typeof window === "undefined") return null;
  try {
    const attemptsKey = `studzy_public_attempts_${courseId}`;
    const existing = localStorage.getItem(attemptsKey);
    if (!existing) return null;
    const attempts: any[] = JSON.parse(existing);
    return attempts.find((a: any) => a.id === attemptId) || null;
  } catch {
    return null;
  }
}

export default function PublicCbtAttemptPage() {
  const params = useParams();
  const attemptId = params.attemptId as string;
  const router = useRouter();

  const [attempt, setAttempt] = useState<any | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!attemptId) return;

    const loadAttempt = () => {
      setLoading(true);
      setError(null);

      try {
        const found = getPublicAttemptFromStorage(attemptId, "CIS214");
        if (!found) {
          setError("Attempt not found. It may have been cleared from your browser storage.");
          setLoading(false);
          return;
        }

        const courseQuestions = localProvider.getQuestions(found.course_id);

        const orderedQuestions = found.question_ids
          .map((id: string) => courseQuestions.find((q: Question) => q.id === id))
          .filter((q: Question | undefined): q is Question => !!q);

        if (orderedQuestions.length === 0 && courseQuestions.length > 0) {
          setError("Questions for this attempt could not be loaded.");
          setLoading(false);
          return;
        }

        setAttempt(found);
        setQuestions(orderedQuestions);
      } catch (err) {
        console.error("Failed to load public attempt:", err);
        setError("Failed to load attempt. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadAttempt();
  }, [attemptId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0A0A0B]">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0A0A0B] text-white p-4">
        <div className="max-w-md text-center space-y-4">
          <h2 className="text-xl font-bold">Session Not Found</h2>
          <p className="text-gray-400 text-sm">{error || "The requested session could not be found."}</p>
          <button
            onClick={() => router.push("/cbtx")}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white font-semibold"
          >
            Start New Session
          </button>
        </div>
      </div>
    );
  }

  const hydratedAttempt: Attempt = {
    ...attempt,
    course_title: attempt.course_title || attempt.course_id,
    course_code: attempt.course_code || attempt.course_id,
  };

  return (
    <CbtInterface
      initialAttempt={hydratedAttempt}
      questions={questions}
      onSubmit={async (data) => {
        return submitPublicCbtAttempt({
          ...data,
          attemptId: data.attemptId,
        });
      }}
      hideAiExplain
    />
  );
}
