import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import type { Resource, Course } from "@/types/database";

interface ResourcePageProps {
  params: Promise<{ id: string }>;
}

export default async function ResourcePage({ params }: ResourcePageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch resource details with course info
  const { data: resource, error: resourceError } = await supabase
    .from("resources")
    .select("*")
    .eq("id", id)
    .single();

  if (resourceError || !resource) {
    notFound();
  }

  // Fetch course details
  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", resource.course_id)
    .single();

  const typedResource = resource as Resource;
  const typedCourse = course as Course | null;

  const typeIcons = {
    video: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    audio: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
      </svg>
    ),
    pdf: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  };

  const typeColors = {
    video: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    audio: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    pdf: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  };

  const typeLabels = {
    video: "Video",
    audio: "Audio",
    pdf: "PDF Document",
  };

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="mb-4 sm:mb-6">
        <ol className="flex flex-wrap items-center gap-1.5 text-xs sm:gap-2 sm:text-sm">
          <li>
            <Link
              href="/dashboard"
              className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
            >
              Dashboard
            </Link>
          </li>
          <li className="text-neutral-400">/</li>
          {typedCourse && (
            <>
              <li>
                <Link
                  href={`/course/${typedCourse.id}`}
                  className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                >
                  {typedCourse.code}
                </Link>
              </li>
              <li className="text-neutral-400">/</li>
            </>
          )}
          <li className="font-medium text-neutral-900 dark:text-white">
            Resource
          </li>
        </ol>
      </nav>

      {/* Resource Card */}
      <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 sm:p-6 md:p-8">
        <div className="flex flex-col gap-4 sm:gap-6 md:flex-row md:items-start">
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl sm:h-20 sm:w-20 ${typeColors[typedResource.type]}`}
          >
            <div className="scale-75 sm:scale-100">
              {typeIcons[typedResource.type]}
            </div>
          </div>
          <div className="flex-1">
            <span
              className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${typeColors[typedResource.type]}`}
            >
              {typeLabels[typedResource.type]}
            </span>
            <h1 className="mt-2 text-xl font-bold text-neutral-900 dark:text-white sm:text-2xl md:text-3xl">
              {typedResource.title}
            </h1>
            {typedResource.description && (
              <p className="mt-3 text-neutral-600 dark:text-neutral-400">
                {typedResource.description}
              </p>
            )}
            {typedCourse && (
              <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-500">
                Part of{" "}
                <Link
                  href={`/course/${typedCourse.id}`}
                  className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
                >
                  {typedCourse.code}: {typedCourse.title}
                </Link>
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800 sm:mt-8 sm:flex-row sm:pt-6">
          <a
            href={typedResource.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex"
          >
            <Button size="lg" className="w-full sm:w-auto">
              <svg
                className="mr-2 h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              {typedResource.type === "video"
                ? "Watch Video"
                : typedResource.type === "audio"
                ? "Listen to Audio"
                : "Download PDF"}
            </Button>
          </a>
          <Link href={`/course/${typedResource.course_id}`}>
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              <svg
                className="mr-2 h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Course
            </Button>
          </Link>
        </div>
      </div>

      {/* Preview Section */}
      <div className="mt-6 sm:mt-8">
        <h2 className="text-base font-semibold text-neutral-900 dark:text-white sm:text-lg">
          Preview
        </h2>
        <div className="mt-4 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900">
          {typedResource.type === "video" && (
            <div className="aspect-video w-full">
              <div className="flex h-full items-center justify-center bg-neutral-900">
                <div className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
                    <svg
                      className="h-8 w-8 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                      />
                    </svg>
                  </div>
                  <p className="mt-4 text-sm text-white/60">
                    Click &quot;Watch Video&quot; to play
                  </p>
                </div>
              </div>
            </div>
          )}
          {typedResource.type === "audio" && (
            <div className="p-8">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                  <svg
                    className="h-7 w-7 text-purple-600 dark:text-purple-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="h-2 w-full rounded-full bg-neutral-300 dark:bg-neutral-700">
                    <div className="h-2 w-0 rounded-full bg-purple-500" />
                  </div>
                  <p className="mt-2 text-sm text-neutral-500">
                    Click &quot;Listen to Audio&quot; to play
                  </p>
                </div>
              </div>
            </div>
          )}
          {typedResource.type === "pdf" && (
            <div className="p-8">
              <div className="flex flex-col items-center justify-center py-8">
                <svg
                  className="h-16 w-16 text-blue-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                <p className="mt-4 font-medium text-neutral-900 dark:text-white">
                  PDF Document
                </p>
                <p className="mt-1 text-sm text-neutral-500">
                  Click &quot;Download PDF&quot; to view
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
