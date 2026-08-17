import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { courses as coursesTable, resources } from "@/lib/db/schema/courses";
import { eq, and, ne, desc } from "drizzle-orm";
import { Video, Music, FileText, Image as ImageIcon } from "lucide-react";
import { ResourceList } from "@/components/resources/ResourceList";
import { CourseProgress } from "@/components/courses/CourseProgress";
import { ShareCourseButton } from "@/components/courses/ShareCourseButton";
import { StudyTimeTracker } from "@/components/study/StudyTimeTracker";
import { StudyBuddies } from "@/components/study/StudyBuddies";
import type { Course, Resource } from "@/types/database";
import type { Metadata } from "next";

interface CoursePageProps {
  params: Promise<{ courseCode: string }>;
}

export async function generateMetadata({ params }: CoursePageProps): Promise<Metadata> {
  const { courseCode: rawCourseCode } = await params;
  const decodedCourseCode = decodeURIComponent(rawCourseCode);
  const canonicalCode = decodedCourseCode.replace(/\s+/g, "").toUpperCase();

  let [course] = await db
    .select()
    .from(coursesTable)
    .where(eq(coursesTable.code, canonicalCode))
    .limit(1);

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedCourseCode);
  if (!course && isUUID) {
    const [byId] = await db
      .select()
      .from(coursesTable)
      .where(eq(coursesTable.id, decodedCourseCode))
      .limit(1);
    course = byId;
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
  const canonicalCode = decodedCourseCode.replace(/\s+/g, "").toUpperCase();

  let [course] = await db
    .select()
    .from(coursesTable)
    .where(eq(coursesTable.code, canonicalCode))
    .limit(1);

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedCourseCode);
  if (!course && isUUID) {
    const [byId] = await db
      .select()
      .from(coursesTable)
      .where(eq(coursesTable.id, decodedCourseCode))
      .limit(1);
    course = byId;
  }

  if (!course) {
    notFound();
  }

  if (rawCourseCode !== course.code || decodedCourseCode === course.id) {
    redirect(`/course/${course.code}`);
  }

  const typedCourse = course as unknown as Course;

  // Fetch resources for this course (only published for students)
  const courseResources = await db
    .select()
    .from(resources)
    .where(
      and(
        eq(resources.course_id, typedCourse.id),
        eq(resources.status, "published"),
        ne(resources.type, "question_bank")
      )
    )
    .orderBy(desc(resources.created_at));

  const typedResources = (courseResources as unknown as Resource[]) || [];

  // Count resources by type
  const videoCount = typedResources.filter((r) => r.type === "video").length;
  const audioCount = typedResources.filter((r) => r.type === "audio").length;
  const pdfCount = typedResources.filter((r) => r.type === "pdf").length;
  const imageCount = typedResources.filter((r) => r.type === "image").length;

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
      <StudyTimeTracker courseId={typedCourse.id} />
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
            <h1 className="text-xl font-bold text-neutral-900 dark:text-white sm:text-3xl">
              {typedCourse.title}
            </h1>
            <StudyBuddies courseId={typedCourse.id} />
            {typedCourse.description && (
              <p className="max-w-2xl text-sm text-neutral-600 dark:text-neutral-400 sm:text-base">
                {typedCourse.description}
              </p>
            )}
          </div>
          <ShareCourseButton courseCode={typedCourse.code} />
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
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-2.5 dark:bg-emerald-900/20">
            <ImageIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              {imageCount} Image{imageCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <CourseProgress courseId={typedCourse.id} totalResources={typedResources.length} />

      {/* Resources Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white sm:text-xl">
          Course Resources
        </h2>
        <ResourceList resources={typedResources} courseId={typedCourse.id} courseCode={typedCourse.code} />
      </div>
    </div>
  );
}
