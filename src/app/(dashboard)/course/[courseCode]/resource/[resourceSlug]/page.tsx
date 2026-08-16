import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { courses as coursesTable, resources } from "@/lib/db/schema/courses";
import { eq, and } from "drizzle-orm";
import { VideoPlayer, AudioPlayer, PDFViewer, ImageViewer, LockedResourcePreview, ViewTracker } from "@/components/media";
import { StudyTimeTracker } from "@/components/study/StudyTimeTracker";
import { DiscussionPanel } from "@/components/resources/DiscussionPanel";
import { StarButton } from "@/components/resources/StarButton";
import type { Metadata } from "next";

interface ResourcePageProps {
  params: Promise<{
    courseCode: string;
    resourceSlug: string;
  }>;
}

export async function generateMetadata({ params }: ResourcePageProps): Promise<Metadata> {
  const { courseCode: rawCourseCode, resourceSlug: rawResourceSlug } = await params;
  const decodedCourseCode = decodeURIComponent(rawCourseCode);
  const resourceSlug = decodeURIComponent(rawResourceSlug);
  const canonicalCourseCode = decodedCourseCode.replace(/\s+/g, "").toUpperCase();

  // 1. Fetch course
  let [course] = await db
    .select()
    .from(coursesTable)
    .where(eq(coursesTable.code, canonicalCourseCode))
    .limit(1);

  const isCourseUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(canonicalCourseCode);
  if (!course && isCourseUUID) {
    const [byId] = await db
      .select()
      .from(coursesTable)
      .where(eq(coursesTable.id, canonicalCourseCode))
      .limit(1);
    course = byId;
  }

  if (!course) return { title: "Resource Not Found | Studzy" };

  // 2. Fetch resource
  let [resource] = await db
    .select()
    .from(resources)
    .where(
      and(
        eq(resources.course_id, course.id),
        eq(resources.slug, resourceSlug)
      )
    )
    .limit(1);

  const normalizedSlug = resourceSlug.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  if (!resource && normalizedSlug !== resourceSlug) {
    const [byNorm] = await db
      .select()
      .from(resources)
      .where(
        and(
          eq(resources.course_id, course.id),
          eq(resources.slug, normalizedSlug)
        )
      )
      .limit(1);
    resource = byNorm;
  }

  const isResourceUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resourceSlug);
  if (!resource && isResourceUUID) {
    const [byId] = await db
      .select()
      .from(resources)
      .where(
        and(
          eq(resources.course_id, course.id),
          eq(resources.id, resourceSlug)
        )
      )
      .limit(1);
    resource = byId;
  }

  if (!resource) {
    return { 
      title: "Resource Not Found | Studzy",
      robots: { index: false, follow: false },
    };
  }

  const titleBase = `${resource.title} – ${course.code} | OAU Resource | Studzy`;
  const title = resource.featured ? `Featured Resource | ${titleBase}` : titleBase;
  
  const description = resource.description 
    ? resource.description.slice(0, 150) + (resource.description.length > 150 ? "..." : "")
    : `Study "${resource.title}" from ${course.code} – ${course.title}. Structured resource for Software Engineering students at Obafemi Awolowo University (OAU).`;

  const url = `https://studzy.me/course/${course.code}/resource/${resource.slug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url,
      siteName: "Studzy",
    },
    alternates: {
      canonical: url,
    },
    robots: {
      index: resource.status === "published",
      follow: resource.status === "published",
    },
  };
}

export default async function ResourcePage({ params }: ResourcePageProps) {
  const { courseCode: rawCourseCode, resourceSlug: rawResourceSlug } = await params;
  const courseCode = decodeURIComponent(rawCourseCode);
  const resourceSlug = decodeURIComponent(rawResourceSlug);
  const user = await getCurrentUser();

  const canonicalCourseCode = courseCode.replace(/\s+/g, "").toUpperCase();

  // 1. Fetch the course
  let [course] = await db
    .select()
    .from(coursesTable)
    .where(eq(coursesTable.code, canonicalCourseCode))
    .limit(1);

  const isCourseUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(canonicalCourseCode);
  if (!course && isCourseUUID) {
    const [byId] = await db
      .select()
      .from(coursesTable)
      .where(eq(coursesTable.id, canonicalCourseCode))
      .limit(1);
    course = byId;
  }

  if (!course) {
    notFound();
  }

  if (rawCourseCode !== course.code || courseCode === course.id) {
    redirect(`/course/${course.code}/resource/${rawResourceSlug}`);
  }

  // 2. Fetch the resource
  let [resource] = await db
    .select()
    .from(resources)
    .where(
      and(
        eq(resources.course_id, course.id),
        eq(resources.slug, resourceSlug),
        eq(resources.status, "published")
      )
    )
    .limit(1);

  const normalizedSlug = resourceSlug.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  if (!resource && normalizedSlug !== resourceSlug) {
    const [byNorm] = await db
      .select()
      .from(resources)
      .where(
        and(
          eq(resources.course_id, course.id),
          eq(resources.slug, normalizedSlug),
          eq(resources.status, "published")
        )
      )
      .limit(1);
    resource = byNorm;
  }

  const isResourceUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resourceSlug);
  if (!resource && isResourceUUID) {
    const [byId] = await db
      .select()
      .from(resources)
      .where(
        and(
          eq(resources.course_id, course.id),
          eq(resources.id, resourceSlug),
          eq(resources.status, "published")
        )
      )
      .limit(1);
    resource = byId;
  }

  if (!resource) {
    notFound();
  }

  if (rawCourseCode !== course.code || courseCode === course.id || resourceSlug === resource.id) {
    redirect(`/course/${course.code}/resource/${resource.slug}`);
  }

  // JSON-LD Structured Data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalResource",
    "name": resource.title,
    "description": resource.description || `Study material for ${course.code} at Obafemi Awolowo University (OAU).`,
    "educationalLevel": "University",
    "learningResourceType": resource.type === "video" ? "VideoObject" : resource.type === "image" ? "ImageObject" : "LectureMaterial",
    "provider": {
      "@type": "Organization",
      "name": "Studzy",
      "sameAs": "https://studzy.me",
    },
    "url": `https://studzy.me/course/${course.code}/resource/${resource.slug}`,
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ViewTracker resourceId={resource.id} />
        <header className="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-2 text-sm">
              <Link
                href="/"
                className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
              >
                Home
              </Link>
              <span className="text-neutral-300 dark:text-neutral-700">/</span>
              <Link
                href="/dashboard"
                className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
              >
                Courses
              </Link>
              <span className="text-neutral-300 dark:text-neutral-700">/</span>
              <span className="text-neutral-900 dark:text-white">{course?.code || "Course"}</span>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <LockedResourcePreview
            resourceType={resource.type as any}
            title={resource.title}
            description={resource.description}
            courseCode={course.code}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ViewTracker resourceId={resource.id} />
      <StudyTimeTracker courseId={course.id} />
      <header className="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
          <nav className="mb-2 flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 sm:mb-4 sm:gap-2 sm:text-sm">
            <Link
              href="/dashboard"
              className="hover:text-neutral-700 dark:hover:text-neutral-200"
            >
              Courses
            </Link>
            <span className="text-neutral-300 dark:text-neutral-700">/</span>
            <Link
              href={`/course/${course.code}`}
              className="hover:text-neutral-700 dark:hover:text-neutral-200"
            >
              {course?.code || "Course"}
            </Link>
            <span className="text-neutral-300 dark:text-neutral-700">/</span>
            <span className="truncate font-medium text-neutral-900 dark:text-white max-w-[150px] sm:max-w-none">
              {resource.title}
            </span>
          </nav>

          <div className="flex items-start gap-3 sm:gap-4">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-12 sm:w-12 sm:rounded-xl ${
                resource.type === "video"
                  ? "bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
                  : resource.type === "audio"
                  ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                  : resource.type === "image"
                  ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
              }`}
            >
              {resource.type === "video" && (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {resource.type === "audio" && (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              )}
              {resource.type === "pdf" && (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              )}
              {resource.type === "image" && (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 1 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-lg font-bold text-neutral-900 dark:text-white sm:text-2xl">
                {resource.title}
              </h1>
              {resource.description && (
                <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400 sm:text-sm">
                  {resource.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <StarButton resourceId={resource.id} />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {resource.type === "video" && (
          <VideoPlayer src={resource.file_url} title={resource.title} resourceId={resource.id} />
        )}
        {resource.type === "audio" && (
          <AudioPlayer src={resource.file_url} title={resource.title} resourceId={resource.id} />
        )}
        {resource.type === "pdf" && (
          <PDFViewer src={resource.file_url} title={resource.title} resourceId={resource.id} />
        )}
        {resource.type === "image" && (
          <ImageViewer src={resource.file_url} title={resource.title} resourceId={resource.id} />
        )}

        <div className="mt-8">
          <Link
            href={`/course/${course.code}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to {course?.title || "Course"}
          </Link>
        </div>

        <DiscussionPanel resourceId={resource.id} />
      </main>
    </div>
  );
}
