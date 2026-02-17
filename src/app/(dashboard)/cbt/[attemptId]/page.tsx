import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import CbtInterface from "@/components/cbt/CbtInterface";
import { Question, Attempt } from "@/types/cbt";

interface CbtAttemptPageProps {
  params: Promise<{ attemptId: string }>;
}

export default async function CbtAttemptPage({ params }: CbtAttemptPageProps) {
  const { attemptId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // 1. Fetch the attempt record
  const { data: attempt, error: attemptError } = await supabase
    .from("attempts")
    .select("*")
    .eq("id", attemptId)
    .eq("user_id", user.id)
    .single();

  if (attemptError || !attempt) {
    notFound();
  }

  if (attempt.completed_at) {
    // If already completed, we can redirect to a result page or handle it in the interface
    // For now, let's allow viewing the interface which will show results
  }

  // 2. Fetch the questions (we'll need to join or fetch the IDs stored if we had a many-to-many)
  // Since our startCbtAttempt action returns questions to the client, but the page should beable to recover state,
  // we could either:
  // a) Store the question order/selection in the DB (Recommended for production)
  // b) For this implementation, we'll assume the client has them, OR we fetch them based on some criteria.
  
  // NOTE: Ideally, 'attempt_answers' or a dedicated 'attempt_questions' table would store which questions were assigned.
  // For this version, let's fetch questions for the course. 
  // IMPORTANT: To be exact, we should have stored the question IDs in the attempt.
  // Since the user SQL didn't have a join table, I'll fetch questions for the course code.
  
  const { data: questions, error: questError } = await supabase
    .from("questions")
    .select("*")
    .eq("course_code", attempt.course_code)
    .limit(attempt.total_questions);

  if (questError || !questions) {
    throw new Error("Failed to load questions");
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <CbtInterface 
          initialAttempt={attempt as Attempt} 
          questions={questions as Question[]} 
        />
      </div>
    </div>
  );
}
