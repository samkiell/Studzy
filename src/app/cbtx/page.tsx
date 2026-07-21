"use client";

import { useState } from "react";
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
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { startPublicCbtAttempt } from "../actions";
import { CbtMode } from "@/types/cbt";

export default function PublicCbtLanding() {
  const router = useRouter();
  const [mode, setMode] = useState<CbtMode>("study");
  const [numQuestions, setNumQuestions] = useState(20);
  const [topic, setTopic] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [metadata, setMetadata] = useState<{
    topics: { name: string; count: number }[];
    totalQuestions: number;
    hasTheoryQuestions: boolean;
    difficulties: { name: string; count: number }[];
  } | null>(null);
  const [timeLimit, setTimeLimit] = useState(30);
  const [difficulty, setDifficulty] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);

  const courseCode = "CIS214";
  const courseTitle = "CIS214 - Problem Fundamentals";

  const handleStart = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { attempt } = await startPublicCbtAttempt({
        courseId: "CIS214",
        mode,
        numberOfQuestions: numQuestions,
        topic: topic === "all" ? undefined : topic,
        timeLimitMinutes: mode === "exam" ? timeLimit : 30,
        difficulty: difficulty === "all" ? undefined : difficulty,
      });

      router.push(`/cbtx/${attempt.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to start CBT session");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white p-4 md:p-12 lg:p-24 flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl relative z-10"
      >
        <header className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs md:text-sm font-medium mb-4">
            <ShieldCheck className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span>Public CBT Mode</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight text-white">
            {courseTitle}
          </h1>
          <p className="text-gray-400 text-sm md:text-lg">
            Practice with real questions, timed sessions, and instant feedback. No login required.
          </p>
        </header>

        <section className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-8 backdrop-blur-xl shadow-2xl">
          <div className="space-y-8">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-3">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  Course
                </label>
              </div>
              <div className="w-full bg-[#121214] border border-white/10 rounded-xl px-4 py-3 text-white">
                {courseCode} - {courseTitle}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  Study Topic
                </label>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={metadataLoading}
                  className="w-full bg-[#121214] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-indigo-500/50 transition-all appearance-none cursor-pointer disabled:opacity-50"
                >
                  <option value="all">All Topics ({metadata?.totalQuestions || 0})</option>
                  {metadata?.topics.map((t) => (
                    <option key={t.name} value={t.name}>
                      {t.name} ({t.count})
                    </option>
                  ))}
                </select>
              </div>
            </div>

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

            <div className="space-y-6">
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
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm mt-6">
              {error}
            </div>
          )}

          <Button
            onClick={handleStart}
            disabled={isLoading}
            className="w-full py-6 rounded-xl text-lg font-bold flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed mt-6"
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
        </section>

        <footer className="mt-8 flex items-center justify-center gap-4 text-gray-500 text-sm">
          <div className="flex items-center gap-1">
            <Info className="w-4 h-4" />
            <span>Your progress is saved locally in your browser</span>
          </div>
        </footer>
      </motion.div>
    </div>
  );
}
