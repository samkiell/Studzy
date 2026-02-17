"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  BookOpen, 
  Settings, 
  Play, 
  Clock, 
  Layers, 
  ShieldCheck, 
  ChevronRight,
  Info
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { startCbtAttempt } from "./actions";
import { CbtMode } from "@/types/cbt";

export default function CbtLandingPage() {
  const router = useRouter();
  const [courseCode, setCourseCode] = useState("CSC201");
  const [mode, setMode] = useState<CbtMode>("study");
  const [numQuestions, setNumQuestions] = useState(20);
  const [timerMinutes, setTimerMinutes] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { attempt } = await startCbtAttempt({
        courseCode,
        mode,
        numberOfQuestions: numQuestions,
      });
      
      router.push(`/cbt/${attempt.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to start CBT session");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white p-6 md:p-12 lg:p-24 flex flex-col items-center">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-indigo-500/10 blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl relative z-10"
      >
        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-4">
            <ShieldCheck className="w-4 h-4" />
            <span>Official CSC201 CBT Engine</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            Introduction to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Python Programming</span>
          </h1>
          <p className="text-gray-400 text-lg">
            Practice with real questions, timed sessions, and AI-powered explanations.
          </p>
        </header>

        <section className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
          <div className="space-y-8">
            {/* Course Selector */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                Select Course
              </label>
              <select 
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                className="w-full bg-[#121214] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all appearance-none text-white cursor-pointer"
              >
                <option value="CSC201">CSC201 - Introduction to Python Programming</option>
              </select>
            </div>

            {/* Mode Selector */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                <Settings className="w-4 h-4 text-indigo-400" />
                Select Mode
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setMode("study")}
                  className={`p-4 rounded-xl border transition-all text-left ${
                    mode === "study" 
                    ? "bg-indigo-500/10 border-indigo-500/50 ring-1 ring-indigo-500/50" 
                    : "bg-white/5 border-white/10 hover:border-white/20"
                  }`}
                >
                  <h3 className={`font-semibold ${mode === "study" ? "text-indigo-400" : "text-white"}`}>Study Mode</h3>
                  <p className="text-xs text-gray-400 mt-1">Instant feedback & AI explanations</p>
                </button>
                <button
                  onClick={() => setMode("exam")}
                  className={`p-4 rounded-xl border transition-all text-left ${
                    mode === "exam" 
                    ? "bg-indigo-500/10 border-indigo-500/50 ring-1 ring-indigo-500/50" 
                    : "bg-white/5 border-white/10 hover:border-white/20"
                  }`}
                >
                  <h3 className={`font-semibold ${mode === "exam" ? "text-indigo-400" : "text-white"}`}>Exam Mode</h3>
                  <p className="text-xs text-gray-400 mt-1">Real-time pressure with a timer</p>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Question Count */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  No. of Questions
                </label>
                <input 
                  type="number" 
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Number(e.target.value))}
                  min={1}
                  max={100}
                  className="w-full bg-[#121214] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-indigo-500/50 transition-all"
                />
              </div>

              {/* Timer Config */}
              <div className={`${mode === "exam" ? "opacity-100" : "opacity-30 pointer-events-none"} transition-all`}>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  Time Limit (Mins)
                </label>
                <input 
                  type="number" 
                  value={timerMinutes}
                  onChange={(e) => setTimerMinutes(Number(e.target.value))}
                  min={1}
                  className="w-full bg-[#121214] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-indigo-500/50 transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            <Button
              onClick={handleStart}
              disabled={isLoading}
              className="w-full py-6 rounded-xl text-lg font-bold flex items-center justify-center gap-2 group"
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
