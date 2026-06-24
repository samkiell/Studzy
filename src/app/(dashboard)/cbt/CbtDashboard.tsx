"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  BookOpen, 
  Settings, 
  Clock, 
  Layers, 
  ShieldCheck, 
  ChevronRight,
  Info,
  BrainCircuit,
  Gauge,
  Download,
  Trash2,
  Wifi,
  WifiOff
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { startCbtAttempt, getCbtMetadata } from "./actions";
import { CbtMode, Question } from "@/types/cbt";
import { Course } from "@/types/database";
import { 
  getDownloadedCourseIds, 
  saveCoursesOffline, 
  saveQuestionsOffline, 
  deleteOfflineCourse, 
  saveOfflineAttempt, 
  getOfflineQuestions 
} from "@/lib/offline/offlineDb";
import { toast } from "react-hot-toast";

interface CbtDashboardProps {
  courses: Course[];
}

export default function CbtDashboard({ courses }: CbtDashboardProps) {
  const router = useRouter();
  const [courseId, setCourseId] = useState("");
  const [mode, setMode] = useState<CbtMode>("study");
  const [numQuestions, setNumQuestions] = useState(20);
  const [topic, setTopic] = useState<string>("all");
  const [isWeakAreasOnly, setIsWeakAreasOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [metadata, setMetadata] = useState<{ topics: { name: string; count: number }[]; totalQuestions: number; hasTheoryQuestions: boolean; difficulties: { name: string; count: number }[] } | null>(null);
  const [timeLimit, setTimeLimit] = useState(30);
  const [difficulty, setDifficulty] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);

  const [isOnline, setIsOnline] = useState(true);
  const [downloadedCourseIds, setDownloadedCourseIds] = useState<string[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);

  // Sync online status and downloaded courses list
  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial load of offline courses
    getDownloadedCourseIds()
      .then((ids) => {
        setDownloadedCourseIds(ids);
      })
      .catch((err) => console.error("Error loading offline courses:", err));

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const selectedCourse = courses.find(c => c.id === courseId);
  const courseTitle = selectedCourse ? selectedCourse.title : "Select a Course";
  const courseCode = selectedCourse ? selectedCourse.code : "";

  // Helper to load metadata from offline IndexedDB database
  const loadOfflineMetadata = async (id: string) => {
    if (!id) return;
    setMetadataLoading(true);
    try {
      const qList = await getOfflineQuestions(id);
      if (!qList || qList.length === 0) {
        setMetadata(null);
        return;
      }
      
      const uniqueTopics = Array.from(new Set(qList.map((q) => q.topic).filter(Boolean))) as string[];
      const topics = uniqueTopics.map((topicName) => ({
        name: topicName,
        count: qList.filter((q) => q.topic === topicName).length,
      }));
      
      const uniqueDifficulties = Array.from(new Set(qList.map((q) => q.difficulty).filter(Boolean))) as string[];
      const difficulties = uniqueDifficulties.map((diffName) => ({
        name: diffName,
        count: qList.filter((q) => q.difficulty === diffName).length,
      }));

      const hasTheory = qList.some(q => !q.options || Object.keys(q.options).length === 0);

      setMetadata({
        topics,
        totalQuestions: qList.length,
        hasTheoryQuestions: hasTheory,
        difficulties,
      });

      if (hasTheory) {
        setMode("exam");
      }
    } catch (err) {
      console.error("Failed to load offline metadata:", err);
    } finally {
      setMetadataLoading(false);
    }
  };

  // Fetch metadata when course changes
  const handleCourseChange = async (id: string) => {
    setCourseId(id);
    setMetadata(null);
    setTopic("all");
    setError(null);
    if (!id) return;

    if (!navigator.onLine) {
      await loadOfflineMetadata(id);
      return;
    }

    setMetadataLoading(true);
    try {
      const data = await getCbtMetadata(id);
      setMetadata(data);
      // Auto-force exam mode for theory questions
      if (data.hasTheoryQuestions) {
        setMode("exam");
      }
    } catch (err) {
      console.error("Failed to fetch metadata:", err);
      // Fallback offline metadata if server call fails
      await loadOfflineMetadata(id);
    } finally {
      setMetadataLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!courseId || !selectedCourse) return;
    setIsDownloading(true);
    setError(null);
    try {
      const response = await fetch(`/api/cbt/download?courseId=${courseId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to download course questions");
      }
      const data = await response.json();
      
      // Save course metadata and downloaded questions offline
      await saveCoursesOffline([selectedCourse]);
      await saveQuestionsOffline(courseId, data.questions as Question[]);
      
      // Update downloaded list
      setDownloadedCourseIds(prev => [...new Set([...prev, courseId])]);
      toast.success(`${courseCode} downloaded for offline use!`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to download course questions.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDeleteDownload = async () => {
    if (!courseId) return;
    try {
      await deleteOfflineCourse(courseId);
      setDownloadedCourseIds(prev => prev.filter(id => id !== courseId));
      toast.success(`${courseCode} offline copy removed.`);
    } catch (err: any) {
      console.error(err);
      setError("Failed to delete offline copy.");
    }
  };

  const handleStart = async () => {
    if (!courseId) {
      setError("Please select a course to continue");
      return;
    }
    setIsLoading(true);
    setError(null);

    if (!isOnline) {
      try {
        const offlineQuestions = await getOfflineQuestions(courseId);
        if (!offlineQuestions || offlineQuestions.length === 0) {
          throw new Error("No offline questions found for this course.");
        }

        const mockAttemptId = `offline_${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15)}`;
        
        // Filter questions by selected difficulty/topic if chosen
        let filteredQuestions = [...offlineQuestions];
        if (topic !== "all") {
          filteredQuestions = filteredQuestions.filter(q => q.topic === topic);
        }
        if (difficulty !== "all") {
          filteredQuestions = filteredQuestions.filter(q => q.difficulty === difficulty);
        }

        if (filteredQuestions.length === 0) {
          throw new Error("No offline questions found matching your filter criteria.");
        }

        const initialAttempt = {
          id: mockAttemptId,
          course_id: courseId,
          course_code: courseCode,
          course_title: courseTitle,
          mode: mode,
          total_questions: Math.min(numQuestions, filteredQuestions.length),
          answers: {},
          questionDurations: {},
          pending_sync: true,
          question_ids: filteredQuestions.slice(0, numQuestions).map(q => q.id),
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
      } finally {
        setIsLoading(false);
      }
      return;
    }

    try {
      const { attempt } = await startCbtAttempt({
        courseId,
        mode,
        numberOfQuestions: numQuestions,
        topic: topic === "all" ? undefined : topic,
        timeLimitMinutes: mode === "exam" ? timeLimit : 30,
        isWeakAreasOnly,
        difficulty: difficulty === "all" ? undefined : difficulty,
      });
      
      router.push(`/cbt/${attempt.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to start CBT session");
      setIsLoading(false);
    }
  };

  const visibleCourses = isOnline
    ? courses
    : courses.filter((c) => downloadedCourseIds.includes(c.id));

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white p-4 md:p-12 lg:p-24 flex flex-col items-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl relative z-10"
      >
        <header className="text-center mb-8 md:mb-12">
          {courseCode && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs md:text-sm font-medium mb-4">
              <ShieldCheck className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span>Official {courseCode} CBT Engine</span>
            </div>
          )}
          <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight text-white">
            {courseTitle}
          </h1>
          <p className="text-gray-400 text-sm md:text-lg">
            Practice with real questions, timed sessions, and AI-powered explanations.
          </p>
        </header>

        <section className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-8 backdrop-blur-xl shadow-2xl">
          <div className="space-y-8">
            {/* Offline Mode Banner */}
            {!isOnline && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-xs md:text-sm flex items-center gap-2.5">
                <WifiOff className="w-4 h-4 shrink-0 text-amber-400" />
                <div>
                  <span className="font-semibold block">Offline Mode Active</span>
                  <span className="text-[11px] md:text-xs text-amber-400/80">Only courses downloaded while online are available.</span>
                </div>
              </div>
            )}

            {/* Course Selector */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  Select Course
                </label>
                
                {/* Download Button */}
                {courseId && isOnline && (
                  <div className="flex items-center gap-2">
                    {downloadedCourseIds.includes(courseId) ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Downloaded ✓
                        </span>
                        <button
                          type="button"
                          onClick={handleDeleteDownload}
                          className="p-1 rounded bg-white/5 hover:bg-red-500/10 hover:text-red-400 text-gray-400 transition-all"
                          title="Remove offline copy"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="flex items-center gap-1 text-[10px] font-extrabold bg-indigo-500/15 border border-indigo-500/35 hover:bg-indigo-500/25 px-2.5 py-1 rounded-full text-indigo-400 transition-all disabled:opacity-50 uppercase tracking-wider"
                      >
                        {isDownloading ? (
                          <div className="w-3 h-3 border border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
                        ) : (
                          <Download className="w-3 h-3" />
                        )}
                        <span>Download offline</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              <select 
                value={courseId}
                onChange={(e) => handleCourseChange(e.target.value)}
                className="w-full bg-[#121214] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all appearance-none text-white cursor-pointer"
              >
                <option value="" disabled>Select a course...</option>
                {visibleCourses.length > 0 ? (
                  visibleCourses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.code} - {course.title}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    {isOnline ? "No CBT courses available" : "No downloaded courses available offline"}
                  </option>
                )}
              </select>
            </div>

            {courseId && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                      <Layers className="w-4 h-4 text-indigo-400" />
                      Study Topic
                    </label>
                    <select
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      disabled={metadataLoading || isWeakAreasOnly}
                      className="w-full bg-[#121214] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-indigo-500/50 transition-all appearance-none cursor-pointer disabled:opacity-50"
                    >
                      <option value="all">All Topics ({metadata?.totalQuestions || 0})</option>
                      {metadata?.topics.map(t => (
                        <option key={t.name} value={t.name}>
                          {t.name} ({t.count})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Difficulty Selector */}
                {metadata && metadata.difficulties.length > 0 && (
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                      <Gauge className="w-4 h-4 text-indigo-400" />
                      Difficulty Level
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setDifficulty("all")}
                        className={`px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${
                          difficulty === "all"
                            ? "bg-indigo-500/10 border-indigo-500/50 ring-1 ring-indigo-500/50 text-indigo-400"
                            : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:text-white"
                        }`}
                      >
                        All ({metadata.totalQuestions})
                      </button>
                      {metadata.difficulties.map((d) => {
                        const colorMap: Record<string, { active: string; text: string }> = {
                          easy: { active: "bg-emerald-500/10 border-emerald-500/50 ring-1 ring-emerald-500/50", text: "text-emerald-400" },
                          medium: { active: "bg-amber-500/10 border-amber-500/50 ring-1 ring-amber-500/50", text: "text-amber-400" },
                          hard: { active: "bg-red-500/10 border-red-500/50 ring-1 ring-red-500/50", text: "text-red-400" },
                        };
                        const colors = colorMap[d.name] || colorMap.medium;
                        const isActive = difficulty === d.name;
                        return (
                          <button
                            key={d.name}
                            onClick={() => setDifficulty(d.name)}
                            className={`px-4 py-2 rounded-xl border text-sm font-semibold transition-all capitalize ${
                              isActive
                                ? `${colors.active} ${colors.text}`
                                : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:text-white"
                            }`}
                          >
                            {d.name} ({d.count})
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Mode Selector */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                    <Settings className="w-4 h-4 text-indigo-400" />
                    Study Mode
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    <button
                      onClick={() => !metadata?.hasTheoryQuestions && setMode("study")}
                      disabled={metadata?.hasTheoryQuestions}
                      className={`p-3 md:p-4 rounded-xl border transition-all text-left ${
                        metadata?.hasTheoryQuestions
                        ? "bg-white/5 border-white/5 opacity-40 cursor-not-allowed"
                        : mode === "study" 
                        ? "bg-indigo-500/10 border-indigo-500/50 ring-1 ring-indigo-500/50" 
                        : "bg-white/5 border-white/10 hover:border-white/20"
                      }`}
                    >
                      <h3 className={`font-semibold text-sm md:text-base ${mode === "study" && !metadata?.hasTheoryQuestions ? "text-indigo-400" : "text-white"}`}>Study Mode</h3>
                      <p className="text-xs text-gray-400 mt-0.5 md:mt-1">
                        {metadata?.hasTheoryQuestions ? "Not available for theory questions" : "Instant feedback & explanations"}
                      </p>
                    </button>
                    <button
                      onClick={() => setMode("exam")}
                      className={`p-3 md:p-4 rounded-xl border transition-all text-left ${
                        mode === "exam" 
                        ? "bg-indigo-500/10 border-indigo-500/50 ring-1 ring-indigo-500/50" 
                        : "bg-white/5 border-white/10 hover:border-white/20"
                      }`}
                    >
                      <h3 className={`font-semibold text-sm md:text-base ${mode === "exam" ? "text-indigo-400" : "text-white"}`}>Exam Mode</h3>
                      <p className="text-xs text-gray-400 mt-0.5 md:mt-1">Hide answers until the very end</p>
                    </button>
                  </div>
                </div>

                {/* Smart study & Count */}
                <div className="space-y-6">
                   <div className="flex items-center justify-between p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
                        <BrainCircuit className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold">Focus on Weak Areas</h4>
                        <p className="text-xs text-gray-500">Study topics where you score below 60%</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsWeakAreasOnly(!isWeakAreasOnly)}
                      className={`w-12 h-6 rounded-full transition-all relative ${isWeakAreasOnly ? 'bg-indigo-500' : 'bg-white/10'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isWeakAreasOnly ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-300">
                        Number of Questions
                      </label>
                      <span className="text-xs text-indigo-400 font-medium">
                        Up to {metadata?.totalQuestions || 0} available
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max={metadata?.totalQuestions || 100}
                        value={numQuestions}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (isNaN(val)) setNumQuestions(0);
                          else setNumQuestions(Math.min(val, metadata?.totalQuestions || 100));
                        }}
                        className="w-full bg-[#121214] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all text-white font-semibold"
                        placeholder="Enter amount..."
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                        {[10, 20, 50].map((preset) => (
                          <button
                            key={preset}
                            onClick={() => setNumQuestions(Math.min(preset, metadata?.totalQuestions || preset))}
                            className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-bold text-gray-400 hover:bg-white/10 hover:text-white transition-all uppercase"
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {mode === "exam" && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                          <Clock className="w-4 h-4 text-indigo-400" />
                          Exam Time Limit (Minutes)
                        </label>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          max="180"
                          value={timeLimit}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (isNaN(val)) setTimeLimit(0);
                            else setTimeLimit(Math.min(val, 180));
                          }}
                          className="w-full bg-[#121214] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all text-white font-semibold"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                          {[30, 45, 60].map((preset) => (
                            <button
                              key={preset}
                              onClick={() => setTimeLimit(preset)}
                              className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-bold text-gray-400 hover:bg-white/10 hover:text-white transition-all uppercase"
                            >
                              {preset}m
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            <Button
              onClick={handleStart}
              disabled={isLoading || !courseId}
              className="w-full py-6 rounded-xl text-lg font-bold flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Start CBT Session
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </div>
        </section>

        <footer className="mt-8 flex items-center justify-center gap-4 text-gray-500 text-sm">
          <div className="flex items-center gap-1">
            <Info className="w-4 h-4" />
            <span>Scores are automatically synced to your dashboard</span>
          </div>
        </footer>
      </motion.div>
    </div>
  );
}
