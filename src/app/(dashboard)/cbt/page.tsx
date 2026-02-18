import { createClient } from "@/lib/supabase/server";
import CbtDashboard from "./CbtDashboard";

export default async function CbtLandingPage() {
  const supabase = await createClient();

  const { data: courses } = await supabase
    .from("courses")
    .select("*")
    .eq("is_cbt", true)
    .order("code");

  return <CbtDashboard courses={courses || []} />;
}
