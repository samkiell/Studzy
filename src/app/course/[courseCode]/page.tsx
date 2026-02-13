import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { Video, Music, FileText } from "lucide-react";
import { ResourceList } from "@/components/resources/ResourceList";
import { CourseProgress } from "@/components/courses/CourseProgress";
import type { Course, Resource } from "@/types/database";
import type { Metadata } from "next";

interface CoursePageProps {
  params: Promise<{ courseCode: string }>;
}

export async function generateMetadata({ params }: CoursePageProps): Promise<Metadata> {
  const { courseCode: rawCourseCode } = await params;
  const decodedCourseCode = decodeURIComponent(rawCourseCode);
  const supabase = await createClient();

  const canonicalCode = decodedCourseCode.replace(/\s+/g, "").toUpperCase();

  let { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("code", canonicalCode)
    .maybeSingle();

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedCourseCode);
  if (!course && isUUID) {
    const { data } = await supabase
      .from("courses")
      .select("*")
      .eq("id", decodedCourseCode)
      .maybeSingle();
    course = data;
  }

  if (!course) {
    return {
      title: "Course Not Found | Studzy",
      robots: { index: false, follow: false },
    };
  }

  const title = `${course.code} – ${course.title} | Software Engineering OAU | Studzy`;
  const description = course.description || 
    `Access ${course.code} – ${course.title} course materials, lecture resources, and structured study content for Software Engineering students at Obafemi Awolowo University (OAU).`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://studzy.me/course/${course.code}`,
      siteName: "Studzy",
    },
    alternates: {
      canonical: `https://studzy.me/course/${course.code}`,
    },
  };
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { courseCode: rawCourseCode } = await params;
  const decodedCourseCode = decodeURIComponent(rawCourseCode);
  const supabase = await createClient();

  console.log(`[CoursePage] Request for: "${rawCourseCode}" (Decoded: "${decodedCourseCode}")`);

  // Canonicalize: Remove all spaces and make uppercase
  const canonicalCode = decodedCourseCode.replace(/\s+/g, "").toUpperCase();

  // Try fetching by the normalized canonical code
  let { data: course, error: courseError } = await supabase
    .from("courses")
    .select("*")
    .eq("code", canonicalCode)
    .maybeSingle();

  // If still not found, try by ID if it's a UUID
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedCourseCode);
  if (!course && !courseError && isUUID) {
    const { data: idData, error: idError } = await supabase
      .from("courses")
      .select("*")
      .eq("id", decodedCourseCode)
      .maybeSingle();
    
    course = idData;
    courseError = idError;
  }

  if (courseError) {
    console.error(`[CoursePage] Database error for "${decodedCourseCode}":`, courseError);
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="mt-6 text-2xl font-bold text-neutral-900 dark:text-white">Connection Error</h2>
        <p className="mt-2 max-w-md text-neutral-600 dark:text-neutral-400">
          We couldn&apos;t connect to the database to fetch <strong>{decodedCourseCode}</strong>. 
          This is often due to a network timeout or temporary service interruption.
        </p>
        <div className="mt-6 space-x-4">
          <Link href="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
          <a href="" className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">
            Retry Page
          </a>
        </div>
        {courseError.message && (
          <p className="mt-8 text-xs text-neutral-400">
            System Error: {courseError.message}
          </p>
        )}
      </div>
    );
  }

  if (!course) {
    console.warn(`[CoursePage] Course not found for: "${decodedCourseCode}"`);
    notFound();
  }

  // FORCE REDIRECT if:
  // 1. URL contains spaces (rawCourseCode !== canonicalCode)
  // 2. URL is via UUID (decodedCourseCode === course.id)
  if (rawCourseCode !== course.code || decodedCourseCode === course.id) {
    const { redirect } = await import("next/navigation");
    redirect(`/course/${course.code}`);
  }

  const typedCourse = course as Course;

  // Fetch resources for this course (only published for students)
  const { data: resources, error: resourcesError } = await supabase
    .from("resources")
    .select("*")
    .eq("course_id", typedCourse.id)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (resourcesError) {
    console.error("Error fetching resources:", resourcesError);
  }

  const typedResources = (resources as Resource[]) || [];

  // Count resources by type
  const videoCount = typedResources.filter((r) => r.type === "video").length;
  const audioCount = typedResources.filter((r) => r.type === "audio").length;
  const pdfCount = typedResources.filter((r) => r.type === "pdf").length;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": typedCourse.title,
    "description": typedCourse.description || `Study materials for ${typedCourse.code} at Obafemi Awolowo University (OAU).`,
    "provider": {
      "@type": "Organization",
      "name": "Studzy",
      "sameAs": "https://studzy.me"
    },
    "courseCode": typedCourse.code
  };

  return (
    <div className="space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Breadcrumb */}
      <nav>
        <ol className="flex items-center gap-2 text-sm">
          <li>
            <Link
              href="/dashboard"
              className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
            >
              Dashboard
            </Link>
          </li>
          <li className="text-neutral-400">/</li>
          <li className="font-medium text-neutral-900 dark:text-white">
            {typedCourse.code}
          </li>
        </ol>
      </nav>

      {/* Course Header */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <span className="inline-flex items-center rounded-lg bg-primary-100 px-3 py-1 text-sm font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
              {typedCourse.code}
            </span>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white sm:text-3xl">
              {typedCourse.title}
            </h1>
            {typedCourse.description && (
              <p className="max-w-2xl text-neutral-600 dark:text-neutral-400">
                {typedCourse.description}
              </p>
            )}
          </div>
        </div>

        {/* Resource Stats */}
        <div className="mt-8 flex flex-wrap gap-3 border-t border-neutral-100 pt-6 dark:border-neutral-800">
          <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2.5 dark:bg-red-900/20">
            <Video className="h-5 w-5 text-red-600 dark:text-red-400" />
            <span className="text-sm font-medium text-red-700 dark:text-red-400">
              {videoCount} Video{videoCount !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-purple-50 px-4 py-2.5 dark:bg-purple-900/20">
            <Music className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-purple-700 dark:text-purple-400">
              {audioCount} Audio{audioCount !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2.5 dark:bg-blue-900/20">
            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
              {pdfCount} PDF{pdfCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <CourseProgress courseId={typedCourse.id} totalResources={typedResources.length} />

      {/* Resources Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
          Course Resources
        </h2>
        <ResourceList resources={typedResources} courseId={typedCourse.id} courseCode={typedCourse.code} />
      </div>
    </div>
  );
}
