"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  WifiOff, 
  BookOpen, 
  BrainCircuit, 
  ChevronRight, 
  ArrowLeft,
  ShieldCheck,
  RefreshCw,
  LayoutDashboard
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Course } from "@/types/database";
import { 
  getOfflineCourses, 
  getOfflineQuestions, 
  saveOfflineAttempt 
} from "@/lib/offline/offlineDb";

export default function OfflineFallbackPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState("");
  const [mode, setMode] = useState<"study" | "exam">("study");
  const [numQuestions, setNumQuestions] = useState(20);
  const [timeLimit, setTimeLimit] = useState(30);
  const [difficulty, setDifficulty] = useState<string>("all");
  const [maxQuestions, setMaxQuestions] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load downloaded courses on mount
  useEffect(() => {
    getOfflineCourses()
      .then((downloaded) => {
        setCourses(downloaded || []);
      })
      .catch((err) => {
        console.error("Failed to load offline courses:", err);
        setError("Could not access offline storage.");
      });
  }, []);

  const selectedCourse = courses.find(c => c.id === courseId);
  const courseTitle = selectedCourse ? selectedCourse.title : "Offline Mode";
  const courseCode = selectedCourse ? selectedCourse.code : "";

  // Load maximum available questions when course changes
  useEffect(() => {
    if (!courseId) return;
    getOfflineQuestions(courseId)
      .then((qList) => {
        setMaxQuestions(qList.length);
        setNumQuestions(Math.min(20, qList.length));
      })
      .catch((err) => {
        console.error("Failed to load offline questions metadata:", err);
      });
  }, [courseId]);

  const handleStartOffline = async () => {
    if (!courseId) {
      setError("Please select a course to start");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const qList = await getOfflineQuestions(courseId);
      if (!qList || qList.length === 0) {
        throw new Error("No offline questions found for this course.");
      }

      // Filter by difficulty if set
      let filtered = [...qList];
      if (difficulty !== "all") {
        filtered = filtered.filter(q => q.difficulty === difficulty);
      }

      if (filtered.length === 0) {
        throw new Error(`No questions found matching difficulty: ${difficulty}`);
      }

      const mockAttemptId = `offline_${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15)}`;
      
      const initialAttempt = {
        id: mockAttemptId,
        course_id: courseId,
        course_code: courseCode,
        course_title: courseTitle,
        mode: mode,
        total_questions: Math.min(numQuestions, filtered.length),
        answers: {},
        questionDurations: {},
        pending_sync: true,
        question_ids: filtered.slice(0, numQuestions).map(q => q.id),
        completed_at: null,
        time_limit_seconds: mode === 'exam' ? timeLimit * 60 : 0,
        score: 0,
        user_id: "offline_user",
        duration_seconds: 0,
        started_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      await saveOfflineAttempt(initialAttempt);
      router.push(`/cbt/offline?attemptId=${mockAttemptId}`);
    } catch (err: any) {
      setError(err.message || "Failed to start offline CBT session");
      setIsLoading(false);
    }
  };

  const handleRetryOnline = () => {
    if (typeof window !== "undefined") {
      if (navigator.onLine) {
        router.push("/dashboard");
      } else {
        setError("Still offline. Please check your internet connection.");
        setTimeout(() => setError(null), 3000);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white p-4 md:p-12 lg:p-24 flex flex-col items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl relative z-10"
      >
        {/* Connection status header */}
        <div className="flex flex-col items-center text-center mb-8 md:mb-12">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 text-amber-400">
            <WifiOff className="w-8 h-8" />
          </div>
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs md:text-sm font-medium mb-4">
            <ShieldCheck className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span>Studzy Offline Portal</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold mb-3 tracking-tight text-white">
            Connection Lost
          </h1>
          <p className="text-gray-400 text-sm md:text-base max-w-md">
            You are offline. However, any courses you previously downloaded are fully available for practice below.
          </p>
        </div>

        {/* Offline Dashboard / Practice Setup */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-xl shadow-2xl space-y-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              Select Downloaded Course
            </label>
            <select 
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full bg-[#121214] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all appearance-none text-white cursor-pointer"
            >
              <option value="" disabled>Select a downloaded course...</option>
              {courses.length > 0 ? (
                courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.code} - {course.title}
                  </option>
                ))
              ) : (
                <option value="" disabled>No offline courses downloaded yet</option>
              )}
            </select>
          </div>

          {courseId && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-6 pt-2"
            >
              {/* Difficulty selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Difficulty</label>
                <div className="flex gap-2">
                  {["all", "easy", "medium", "hard"].map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setDifficulty(diff)}
                      className={`px-3 py-1.5 rounded-lg border text-xs capitalize font-medium transition-all ${
                        difficulty === diff
                          ? "bg-indigo-500/10 border-indigo-500/40 text-indigo-400"
                          : "bg-white/5 border-white/10 hover:border-white/20 text-gray-400"
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mode Selection */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setMode("study")}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    mode === "study"
                      ? "bg-indigo-500/10 border-indigo-500/40 text-indigo-400"
                      : "bg-white/5 border-white/10 hover:border-white/25"
                  }`}
                >
                  <span className="font-bold block text-sm">Study Mode</span>
                  <span className="text-[10px] text-gray-500 mt-0.5 block">Instant explanations</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode("exam")}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    mode === "exam"
                      ? "bg-indigo-500/10 border-indigo-500/40 text-indigo-400"
                      : "bg-white/5 border-white/10 hover:border-white/25"
                  }`}
                >
                  <span className="font-bold block text-sm">Exam Mode</span>
                  <span className="text-[10px] text-gray-500 mt-0.5 block">Timed, hide explanations</span>
                </button>
              </div>

              {/* Count Input */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Questions Count</span>
                  <span className="text-indigo-400">Up to {maxQuestions} offline questions</span>
                </div>
                <input
                  type="number"
                  min={1}
                  max={maxQuestions}
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Math.min(maxQuestions, parseInt(e.target.value) || 1))}
                  className="w-full bg-[#121214] border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500/50 text-white font-mono text-sm"
                />
              </div>

              {/* Exam Timer */}
              {mode === "exam" && (
                <div className="space-y-2">
                  <span className="text-xs text-gray-400">Time Limit (Minutes)</span>
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(Math.min(180, parseInt(e.target.value) || 1))}
                    className="w-full bg-[#121214] border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500/50 text-white font-mono text-sm"
                  />
                </div>
              )}
            </motion.div>
          )}

          {error && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              onClick={handleStartOffline}
              disabled={isLoading || !courseId}
              className="flex-1 py-5 rounded-xl font-bold flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Start Offline CBT
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </Button>
            
            <Button
              onClick={handleRetryOnline}
              variant="outline"
              className="py-5 rounded-xl border border-white/10 hover:bg-white/5 text-gray-300 font-bold flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retry Connection
            </Button>
          </div>
        </section>

        {/* Back to dashboard button (only works when back online) */}
        <div className="mt-8 flex items-center justify-center">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-400 transition-colors"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Go to Dashboard</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
