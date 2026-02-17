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
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  
  let { data: resource, error: resourceError } = await supabase
    .from("resources")
    .select("slug, courses(code)")
    .eq("slug", id)
    .maybeSingle();

  if (!resource && !resourceError && isUUID) {
    const { data, error } = await supabase
      .from("resources")
      .select("slug, courses(code)")
      .eq("id", id)
      .maybeSingle();
    resource = data;
    resourceError = error;
  }

  if (resourceError || !resource) {
    notFound();
  }

  const courses = resource.courses as any;
  const courseCode = Array.isArray(courses) ? courses[0]?.code : courses?.code;

  if (courseCode && resource.slug) {
    redirect(`/course/${courseCode}/resource/${resource.slug}`);
  }

  notFound();
}
