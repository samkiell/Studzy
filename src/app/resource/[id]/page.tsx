import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface ResourcePageProps {
  params: Promise<{ id: string }>;
}

/**
 * Legacy route handler to redirect old resource URLs to the new slug-based structure:
 * /resource/[id] -> /course/[courseCode]/resource/[resourceSlug]
 */
export default async function ResourcePage({ params }: ResourcePageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch resource details with course info
  const { data: resource, error: resourceError } = await supabase
    .from("resources")
    .select("slug, courses(code)")
    .or(`id.eq."${id}",slug.eq."${id}"`)
    .maybeSingle();

  if (resourceError || !resource) {
    notFound();
  }

  const courseCode = resource.courses?.code;
  if (courseCode && resource.slug) {
    redirect(`/course/${courseCode}/resource/${resource.slug}`);
  }

  notFound();
}
