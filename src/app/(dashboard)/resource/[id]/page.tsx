import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { resources, courses } from "@/lib/db/schema/courses";
import { eq, or } from "drizzle-orm";

interface ResourcePageProps {
  params: Promise<{ id: string }>;
}

export default async function ResourcePage({ params }: ResourcePageProps) {
  const { id } = await params;

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  const [resource] = await db
    .select({
      slug: resources.slug,
      course_code: courses.code,
    })
    .from(resources)
    .leftJoin(courses, eq(resources.course_id, courses.id))
    .where(
      isUUID
        ? or(eq(resources.slug, id), eq(resources.id, id))
        : eq(resources.slug, id)
    )
    .limit(1);

  if (!resource || !resource.course_code || !resource.slug) {
    notFound();
  }

  redirect(`/course/${resource.course_code}/resource/${resource.slug}`);
}
