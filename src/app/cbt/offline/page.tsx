"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getOfflineAttempt, getOfflineQuestions } from "@/lib/offline/offlineDb";
import CbtInterface from "@/components/cbt/CbtInterface";
import { Question } from "@/types/cbt";

function CBTOfflineRunner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const attemptId = searchParams.get("attemptId");

  const [attempt, setAttempt] = useState<any | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!attemptId) {
      setError("No attempt ID provided.");
      setIsLoading(false);
      return;
    }

    const loadAttemptData = async () => {
      try {
        const storedAttempt = await getOfflineAttempt(attemptId);
        if (!storedAttempt) {
          setError("Offline attempt not found.");
          return;
        }

        // Fetch all questions for this course
        const allQuestions = await getOfflineQuestions(storedAttempt.course_id);
        
        // Filter and reorder to match storedAttempt.question_ids
        const orderedQuestions = storedAttempt.question_ids
          .map(id => allQuestions.find(q => q.id === id))
          .filter((q): q is Question => !!q);

        if (orderedQuestions.length === 0) {
          setError("Offline questions for this course could not be loaded.");
          return;
        }

        setAttempt(storedAttempt);
        setQuestions(orderedQuestions);
      } catch (err: any) {
        console.error("Error loading offline attempt data:", err);
        setError(err.message || "Failed to load offline data.");
      } finally {
        setIsLoading(false);
      }
    };

    loadAttemptData();
  }, [attemptId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0A0A0B]">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0A0A0B] text-white p-6">
        <h2 className="text-xl font-bold text-red-400 mb-2">Offline Practice Error</h2>
        <p className="text-gray-400 mb-6 text-center max-w-md">{error || "Something went wrong."}</p>
        <button
          onClick={() => router.push("/offline")}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold transition-all text-sm"
        >
          Go Back to Offline Hub
        </button>
      </div>
    );
  }

  return (
    <CbtInterface
      initialAttempt={attempt}
      questions={questions}
    />
  );
}

export default function CBTOfflinePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-[#0A0A0B]">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    }>
      <CBTOfflineRunner />
    </Suspense>
  );
}
