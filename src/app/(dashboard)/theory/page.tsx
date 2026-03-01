import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TheoryDashboard from "./TheoryDashboard";

export const metadata = {
  title: "Theory Exams | Studzy",
  description: "Practice written theory exams with AI-powered grading",
};

export default async function TheoryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch courses with exam_type = 'theory'
  const { data: courses } = await supabase
    .from("courses")
    .select("*")
    .eq("exam_type", "theory")
    .order("code");

  // Fetch all theory exams grouped by course
  const courseIds = (courses || []).map((c) => c.id);

  let exams: any[] = [];
  if (courseIds.length > 0) {
    const { data } = await supabase
      .from("theory_exams")
      .select("*")
      .in("course_id", courseIds)
      .order("created_at", { ascending: false });
    exams = data || [];
  }

  // Fetch user's recent attempts
  const { data: recentAttempts } = await supabase
    .from("theory_attempts")
    .select("*")
    .eq("user_id", user.id)
    .order("started_at", { ascending: false })
    .limit(10);

  return (
    <TheoryDashboard
      courses={courses || []}
      exams={exams}
      recentAttempts={recentAttempts || []}
    />
  );
}
