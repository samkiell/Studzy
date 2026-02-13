import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { VideoPlayer, AudioPlayer, PDFViewer, LockedResourcePreview } from "@/components/media";

interface ResourcePageProps {
  params: Promise<{
    courseId: string;
    resourceId: string;
  }>;
}

export default async function ResourcePage({ params }: ResourcePageProps) {
  const { courseId, resourceId } = await params;
  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch the resource with course info
  const { data: resource, error: resourceError } = await supabase
    .from("resources")
    .select("*, courses(*)")
    .eq("id", resourceId)
    .eq("course_id", courseId)
    .single();

  if (resourceError || !resource) {
    notFound();
  }

  const course = resource.courses;

  // If not authenticated, show locked preview
  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
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
            courseId={courseId}
          />
        </main>
      </div>
    );
  }

  // User is authenticated - show the resource
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
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
              href={`/course/${courseId}`}
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
          <VideoPlayer src={resource.file_url} title={resource.title} resourceId={resourceId} />
        )}
        {resource.type === "audio" && (
          <AudioPlayer src={resource.file_url} title={resource.title} resourceId={resourceId} />
        )}
        {resource.type === "pdf" && (
          <PDFViewer src={resource.file_url} title={resource.title} resourceId={resourceId} />
        )}

        {/* Back Link */}
        <div className="mt-8">
          <Link
            href={`/course/${courseId}`}
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
