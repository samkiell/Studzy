import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Video, Music, FileText } from "lucide-react";
import { ResourceList } from "@/components/resources/ResourceList";
import { CourseProgress } from "@/components/courses/CourseProgress";
import type { Course, Resource } from "@/types/database";

interface CoursePageProps {
  params: Promise<{ courseId: string }>;
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { courseId } = await params;
  const supabase = await createClient();

  // Fetch course details
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .single();

  if (courseError || !course) {
    notFound();
  }

  // Fetch resources for this course (only published for students)
  const { data: resources, error: resourcesError } = await supabase
    .from("resources")
    .select("*")
    .eq("course_id", courseId)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (resourcesError) {
    console.error("Error fetching resources:", resourcesError);
  }

  const typedCourse = course as Course;
  const typedResources = (resources as Resource[]) || [];

  // Count resources by type
  const videoCount = typedResources.filter((r) => r.type === "video").length;
  const audioCount = typedResources.filter((r) => r.type === "audio").length;
  const pdfCount = typedResources.filter((r) => r.type === "pdf").length;

  return (
    <div className="space-y-8">
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
      <CourseProgress courseId={courseId} totalResources={typedResources.length} />

      {/* Resources Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
          Course Resources
        </h2>
        <ResourceList resources={typedResources} courseId={courseId} />
      </div>
    </div>
  );
}
