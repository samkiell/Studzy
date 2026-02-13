import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { VideoPlayer, AudioPlayer, PDFViewer, LockedResourcePreview, ViewTracker } from "@/components/media";

interface ResourcePageProps {
  params: Promise<{
    courseCode: string;
    resourceSlug: string;
  }>;
}

import { Metadata } from "next";

export async function generateMetadata({ params }: ResourcePageProps): Promise<Metadata> {
  const { courseCode: rawCourseCode, resourceSlug: rawResourceSlug } = await params;
  const decodedCourseCode = decodeURIComponent(rawCourseCode);
  const resourceSlug = decodeURIComponent(rawResourceSlug);
  const canonicalCourseCode = decodedCourseCode.replace(/\s+/g, "").toUpperCase();
  const supabase = await createClient();

  // 1. Fetch course
  const isCourseUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(canonicalCourseCode);
  let { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("code", canonicalCourseCode)
    .maybeSingle();

  if (!course && isCourseUUID) {
    const { data } = await supabase.from("courses").select("*").eq("id", canonicalCourseCode).maybeSingle();
    course = data;
  }

  if (!course) return { title: "Resource Not Found | Studzy" };

  // 2. Fetch resource
  const isResourceUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resourceSlug);
  const normalizedSlug = resourceSlug.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  let { data: resource } = await supabase
    .from("resources")
    .select("*")
    .eq("course_id", course.id)
    .eq("slug", resourceSlug)
    .maybeSingle();

  if (!resource && normalizedSlug !== resourceSlug) {
    const { data } = await supabase
      .from("resources")
      .select("*")
      .eq("course_id", course.id)
      .eq("slug", normalizedSlug)
      .maybeSingle();
    resource = data;
  }

  if (!resource && isResourceUUID) {
    const { data } = await supabase.from("resources").select("*").eq("course_id", course.id).eq("id", resourceSlug).maybeSingle();
    resource = data;
  }

  if (!resource) return { 
    title: "Resource Not Found | Studzy",
    robots: { index: false, follow: false }
  };

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
  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log(`[ResourcePage] Fetching: Course="${courseCode}", Resource="${resourceSlug}"`);

  // Canonicalize: Remove all spaces and make uppercase
  const canonicalCourseCode = courseCode.replace(/\s+/g, "").toUpperCase();

  // 1. Fetch the course first
  const isCourseUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(canonicalCourseCode);
  
  let { data: course, error: courseError } = await supabase
    .from("courses")
    .select("*")
    .eq("code", canonicalCourseCode)
    .maybeSingle();

  if (!course && !courseError && isCourseUUID) {
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("id", canonicalCourseCode)
      .maybeSingle();
    course = data;
    courseError = error;
  }

  if (courseError) {
    console.error(`[ResourcePage] Course fetch error:`, JSON.stringify(courseError, null, 2));
    return <ErrorDisplay error={courseError} item={courseCode} />;
  }

  if (!course) {
    console.warn(`[ResourcePage] Course not found: "${courseCode}"`);
    notFound();
  }

  // FORCE REDIRECT if course part of URL has spaces or is ID
  if (rawCourseCode !== course.code || courseCode === course.id) {
    const { redirect } = await import("next/navigation");
    redirect(`/course/${course.code}/resource/${rawResourceSlug}`);
  }

  // 2. Fetch the resource belonging to that course
  const isResourceUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resourceSlug);
  const normalizedSlug = resourceSlug.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  let { data: resource, error: resourceError } = await supabase
    .from("resources")
    .select("*")
    .eq("course_id", course.id)
    .eq("slug", resourceSlug)
    .eq("status", "published")
    .maybeSingle();

  // Try normalized slug if not found
  if (!resource && !resourceError && normalizedSlug !== resourceSlug) {
    const { data, error } = await supabase
      .from("resources")
      .select("*")
      .eq("course_id", course.id)
      .eq("slug", normalizedSlug)
      .eq("status", "published")
      .maybeSingle();
    resource = data;
    resourceError = error;
  }

  if (!resource && !resourceError && isResourceUUID) {
    const { data, error } = await supabase
      .from("resources")
      .select("*")
      .eq("course_id", course.id)
      .eq("id", resourceSlug)
      .eq("status", "published")
      .maybeSingle();
    resource = data;
    resourceError = error;
  }

  if (resourceError) {
    console.error(`[ResourcePage] Resource fetch error:`, JSON.stringify(resourceError, null, 2));
    return <ErrorDisplay error={resourceError} item={resourceSlug} />;
  }

  if (!resource) {
    console.warn(`[ResourcePage] Resource not found: "${resourceSlug}" in course "${courseCode}"`);
    notFound();
  }

  // FORCE REDIRECT if:
  // 1. URL has spaces/wrong case (rawCourseCode !== course.code)
  // 2. URL is via UUID (courseCode === course.id)
  // 3. Resource URL is legacy/UUID (resourceSlug === resource.id)
  const isLegacyUrl = 
    rawCourseCode !== course.code || 
    courseCode === course.id || 
    resourceSlug === resource.id;

  if (isLegacyUrl) {
    const { redirect } = await import("next/navigation");
    redirect(`/course/${course.code}/resource/${resource.slug}`);
  }

  // JSON-LD Structured Data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalResource",
    "name": resource.title,
    "description": resource.description || `Study material for ${course.code} at Obafemi Awolowo University (OAU).`,
    "educationalLevel": "University",
    "learningResourceType": resource.type === 'video' ? 'VideoObject' : 'LectureMaterial',
    "provider": {
      "@type": "Organization",
      "name": "Studzy",
      "sameAs": "https://studzy.me"
    },
    "url": `https://studzy.me/course/${course.code}/resource/${resource.slug}`
  };

  // If not authenticated, show locked preview
  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ViewTracker resourceId={resource.id} />
        {/* Header */}
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

        {/* Locked Content */}
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <LockedResourcePreview
            resourceType={resource.type}
            title={resource.title}
            description={resource.description}
            courseCode={course.code}
          />
        </main>
      </div>
    );
  }

  // User is authenticated - show the resource
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ViewTracker resourceId={resource.id} />
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-4 flex items-center gap-2 text-sm">
            <Link
              href="/dashboard"
              className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
            >
              Courses
            </Link>
            <span className="text-neutral-300 dark:text-neutral-700">/</span>
            <Link
              href={`/course/${course.code}`}
              className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
            >
              {course?.code || "Course"}
            </Link>
            <span className="text-neutral-300 dark:text-neutral-700">/</span>
            <span className="text-neutral-900 dark:text-white">
              {resource.title.length > 30 ? resource.title.slice(0, 30) + "..." : resource.title}
            </span>
          </nav>

          {/* Title & Meta */}
          <div className="flex items-start gap-4">
            {/* Type Icon */}
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                resource.type === "video"
                  ? "bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
                  : resource.type === "audio"
                  ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                  : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
              }`}
            >
              {resource.type === "video" && (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
              {resource.type === "audio" && (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                  />
                </svg>
              )}
              {resource.type === "pdf" && (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                {resource.title}
              </h1>
              {resource.description && (
                <p className="mt-1 text-neutral-600 dark:text-neutral-400">
                  {resource.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Media Player */}
        {resource.type === "video" && (
          <VideoPlayer src={resource.file_url} title={resource.title} resourceId={resource.id} />
        )}
        {resource.type === "audio" && (
          <AudioPlayer src={resource.file_url} title={resource.title} resourceId={resource.id} />
        )}
        {resource.type === "pdf" && (
          <PDFViewer src={resource.file_url} title={resource.title} resourceId={resource.id} />
        )}

        {/* Back Link */}
        <div className="mt-8">
          <Link
            href={`/course/${course.code}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to {course?.title || "Course"}
          </Link>
        </div>
      </main>
    </div>
  );
}

function ErrorDisplay({ error, item }: { error: any; item: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
        <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h2 className="mt-6 text-2xl font-bold text-neutral-900 dark:text-white">Connection Error</h2>
      <p className="mt-2 max-w-md text-neutral-600 dark:text-neutral-400">
        We couldn&apos;t connect to the database to fetch <strong>{item}</strong>.
      </p>
      <div className="mt-6 space-x-4">
        <Link href="/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
        <a href="" className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">
          Retry Page
        </a>
      </div>
      {error && (
        <p className="mt-8 text-xs text-neutral-400">
          Error Detail: {error.message || JSON.stringify(error)}
        </p>
      )}
    </div>
  );
}
