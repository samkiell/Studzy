import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTheoryAttemptSession } from "../actions";
import TheoryExamEngine from "@/components/theory/TheoryExamEngine";

interface TheoryAttemptPageProps {
  params: Promise<{ attemptId: string }>;
}

export default async function TheoryAttemptPage({
  params,
}: TheoryAttemptPageProps) {
  const { attemptId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  try {
    const session = await getTheoryAttemptSession(attemptId);

    return (
      <TheoryExamEngine
        attempt={session.attempt}
        exam={session.exam}
        questions={session.questions}
      />
    );
  } catch {
    notFound();
  }
}
