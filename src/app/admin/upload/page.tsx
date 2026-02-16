import { createClient } from "@/lib/supabase/server";
import { UploadForm } from "@/components/admin";
import type { Course } from "@/types/database";

export default async function AdminUploadPage() {
  const supabase = await createClient();

  // Fetch all courses for the dropdown
  const { data: courses, error } = await supabase
    .from("courses")
    .select("*")
    .order("code", { ascending: true });

  if (error) {
    console.error("Error fetching courses:", error);
  }

  const typedCourses = (courses as Course[]) || [];

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white md:text-3xl">
          Upload Resource
        </h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          Add new learning materials to your courses
        </p>
      </div>

      {/* Upload Card */}
      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 md:p-8">
          {/* Info Banner */}
          <div className="mb-6 flex items-start gap-3 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
            <svg
              className="mt-0.5 h-5 w-5 shrink-0 text-blue-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p className="font-medium">Upload Guidelines</p>
              <ul className="mt-1 list-inside list-disc text-blue-600 dark:text-blue-400">
                <li>Maximum file size: 100MB</li>
                <li>Supported formats: MP4, WebM, MP3, WAV, PDF, Images</li>
                <li>Files are stored securely in Supabase Storage</li>
              </ul>
            </div>
          </div>

          <UploadForm courses={typedCourses} />
        </div>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-neutral-200 bg-white p-4 text-center dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">
              {typedCourses.length}
            </p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Courses
            </p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-white p-4 text-center dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">
              100MB
            </p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Max Size
            </p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-white p-4 text-center dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">
              4
            </p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              File Types
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
