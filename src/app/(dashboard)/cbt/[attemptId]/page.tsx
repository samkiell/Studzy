import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import CbtInterface from "@/components/cbt/CbtInterface";
import { Question, Attempt } from "@/types/cbt";
import { shuffle } from "@/lib/utils";

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
  const { data: attemptData, error: attemptError } = await supabase
    .from("attempts")
    .select("*")
    .eq("id", attemptId)
    .eq("user_id", user.id)
    .single();

  if (attemptError || !attemptData) {
    console.error("Attempt fetch error:", attemptError);
    notFound();
  }

  // 2. Fetch the course title
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("title")
    .eq("id", attemptData.course_id)
    .single();

  if (courseError) {
    console.error("Course fetch error:", courseError);
  }

  // Hydrate attempt with title
  const attempt: Attempt = {
    ...attemptData,
    course_title: course?.title || "Unknown Course"
  } as Attempt;

  if (attempt.completed_at) {
    // If completed, just show results (CbtInterface handles isSubmitted state if we pass it, 
    // but ideally we'd show a summary. For now, we pass the attempt and it might show the result view)
  }

  // 3. Fetch questions using course_id
  // 3. Fetch questions using course_id
  // NOTE: In a production environment, we should persistently store the list of question IDs 
  // assigned to this attempt to ensure the user sees the *exact same* questions on refresh.
  // For now, we fetch ALL questions from the course and randomize them.
  const { data: allQuestions, error: questError } = await supabase
    .from("questions")
    .select("*")
    .eq("course_id", attemptData.course_id);

  if (questError || !allQuestions) {
    console.error("Questions fetch error:", questError);
    throw new Error("Failed to load questions");
  }

  // Randomize and select N questions
  const questions = shuffle(allQuestions as Question[]).slice(0, attempt.total_questions);

  if (questError || !questions) {
    console.error("Questions fetch error:", questError);
    throw new Error("Failed to load questions");
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <CbtInterface 
          initialAttempt={attempt} 
          questions={questions as Question[]} 
        />
      </div>
    </div>
  );
}
