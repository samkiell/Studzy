import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getTheoryAttemptSession } from "../actions";
import TheoryExamEngine from "@/components/theory/TheoryExamEngine";

interface TheoryAttemptPageProps {
  params: Promise<{ attemptId: string }>;
}

export default async function TheoryAttemptPage({
  params,
}: TheoryAttemptPageProps) {
  const { attemptId } = await params;
  const user = await getCurrentUser();

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
