"use client";

import { useQuizContext } from "@/context/QuizContext";
import { Button } from "@/components/ui/Button";
import { ChevronLeft, BrainCircuit, Sparkles, AlertCircle, CheckCircle2, Loader2, RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useState, useEffect, useCallback, useRef } from "react";
import { generateExplanationPrompt } from "@/lib/cbt/ai-utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import NextImage from "next/image";

export default function ExplainPage() {
  const router = useRouter();
  const { session, questions: orderedQuestions, isHydrated } = useQuizContext();
  const [aiExplanation, setAiExplanation] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchAiExplanation = useCallback(async () => {
    if (!session || !orderedQuestions.length) return;
    
    const currentQuestion = orderedQuestions[session.currentIndex];
    const selectedOption = session.answers[currentQuestion.id];
    
    if (!currentQuestion || !selectedOption) return;

    // Abort previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);
    setAiExplanation("");

    try {
      const prompt = generateExplanationPrompt(currentQuestion, selectedOption);
      
      // Set a client-side timeout
      const timeoutId = setTimeout(() => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          setError("The request timed out. Please try again.");
          setIsLoading(false);
        }
      }, 60000); // 60s timeout for complex explanations

      console.log("[AI] 📡 Fetching explanation (non-streaming)...");
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          mode: "chat",
          enable_search: false,
          enable_code: false,
          stream: false,
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error("[AI] ❌ API response not OK:", response.status, response.statusText);
        throw new Error(`Failed to reach Studzy AI (${response.status})`);
      }

      const data = await response.json();
      console.log("[AI] ✅ Received response. Content length:", data.content?.length || 0);
      
      if (data.content) {
        setAiExplanation(data.content);
      } else {
        throw new Error("No explanation received");
      }
      
      // Final scroll on completion
      if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error("AI Explanation Error:", err);
      setError(err.message || "Failed to generate explanation. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [session, orderedQuestions]);

  useEffect(() => {
    if (isHydrated && session && orderedQuestions.length && !aiExplanation && !isLoading && !error) {
      fetchAiExplanation();
    }
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isHydrated, session, orderedQuestions, aiExplanation, isLoading, error, fetchAiExplanation]);

  // Auto-scroll while streaming
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [aiExplanation]);

  if (!isHydrated || !session || !orderedQuestions.length) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0A0A0B]">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  const currentQuestion = orderedQuestions[session.currentIndex];
  
  if (!currentQuestion) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0A0A0B] gap-4">
        <AlertCircle className="w-8 h-8 text-red-500" />
        <p className="text-gray-400">Question not found.</p>
        <Button variant="ghost" onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const selectedOption = session.answers[currentQuestion.id];
  const isCorrect = selectedOption === currentQuestion.correct_option;

  return (
    <div className="min-h-screen bg-[#0A0A0B] pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-white/5 bg-[#0A0A0B]/95 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white gap-2"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Quiz
          </Button>
          <div className="flex items-center gap-2">
            <NextImage src="/favicon.png" alt="Studzy" width={20} height={20} />
            <span className="text-sm font-bold text-white uppercase tracking-tighter">Studzy AI</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-8 space-y-8">
        {/* Question Review */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Question {session.currentIndex + 1}
            </span>
            <span className="text-indigo-400 text-[10px] font-bold uppercase tracking-widest">
              {currentQuestion.topic || "General"}
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-medium text-white/90 leading-tight">
            {currentQuestion.question_text}
          </h1>
        </div>

        {/* Options Feedback */}
        <div className="grid grid-cols-1 gap-3">
          {Object.entries(currentQuestion.options).map(([key, value]) => {
            const isSelected = selectedOption === key;
            const isCorrectOption = key === currentQuestion.correct_option;
            
            let styles = "bg-white/2 border-white/5 text-gray-400";
            if (isCorrectOption) styles = "bg-green-500/10 border-green-500/20 text-green-400";
            else if (isSelected) styles = "bg-red-500/10 border-red-500/20 text-red-400";

            return (
              <div 
                key={key}
                className={`p-4 rounded-xl border flex items-start gap-4 ${styles}`}
              >
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                  isCorrectOption ? 'bg-green-500 text-white' : isSelected ? 'bg-red-500 text-white' : 'bg-white/5 text-gray-500'
                }`}>
                  {key.toUpperCase()}
                </div>
                <div className="flex-1 text-sm">
                  {value}
                </div>
              </div>
            );
          })}
        </div>

        {/* AI Content */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 md:p-8 rounded-3xl border border-indigo-500/10 bg-indigo-500/[0.02] relative overflow-hidden"
        >
          <div className="absolute -right-10 -top-10 w-40 h-40 blur-3xl rounded-full opacity-5 bg-indigo-500" />
          
          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  isCorrect ? 'bg-green-500/20' : 'bg-red-500/20'
                }`}>
                  {isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">
                    {isCorrect ? "Spot on!" : "Wrong"}
                  </h4>
                  <p className="text-[10px] text-gray-400">
                    {isCorrect 
                      ? "Your logic holds up. Here's why this is correct:" 
                      : `The correct answer is ${currentQuestion.correct_option.toUpperCase()}. Let's break it down:`}
                  </p>
                </div>
              </div>
              
              {!isLoading && aiExplanation && (
                <Button 
                  onClick={fetchAiExplanation}
                  variant="ghost"
                  className="h-8 px-3 text-[10px] text-gray-500 hover:text-white gap-1.5"
                >
                  <RefreshCcw className="w-3 h-3" />
                  Regenerate
                </Button>
              )}
            </div>

            <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-neutral-900 prose-pre:text-neutral-100">
              <div className="bg-white/5 border border-white/5 p-6 rounded-2xl min-h-[140px] relative">
                {(isLoading && !aiExplanation) && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/[0.02] backdrop-blur-[2px] rounded-2xl z-20">
                    <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                    <p className="text-xs text-indigo-400 font-medium animate-pulse">Analyzing question...</p>
                  </div>
                )}
                
                {error && !isLoading && (
                  <div className="flex flex-col items-center justify-center gap-3 py-4">
                    <p className="text-sm text-red-400">{error}</p>
                    <Button size="sm" onClick={fetchAiExplanation} className="bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20">Try Again</Button>
                  </div>
                )}

                <div className={(isLoading && !aiExplanation) ? "opacity-0 invisible" : "opacity-100 visible"}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      table({ children }) {
                        return (
                          <div className="my-4 overflow-x-auto rounded-xl border border-white/10">
                            <table className="min-w-full divide-y divide-white/10 text-sm">
                              {children}
                            </table>
                          </div>
                        );
                      },
                      thead({ children }) {
                        return <thead className="bg-white/5">{children}</thead>;
                      },
                      th({ children }) {
                        return <th className="px-4 py-2 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{children}</th>;
                      },
                      td({ children }) {
                        return <td className="px-4 py-2 text-gray-300 border-t border-white/5">{children}</td>;
                      },
                      code({ className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || "");
                        const isInline = !match;
                        return isInline ? (
                          <code
                            className="rounded bg-white/10 px-1.5 py-0.5 text-sm font-mono text-indigo-400"
                            {...props}
                          >
                            {children}
                          </code>
                        ) : (
                            <pre className="block w-full overflow-x-auto rounded-xl bg-black/50 p-4 text-xs md:text-sm text-gray-200 font-mono border border-white/5 scrollbar-thin scrollbar-thumb-white/10">
                              <code className={`${className} block min-w-full`} {...props}>
                                {children}
                              </code>
                            </pre>
                        );
                      },
                    }}
                  >
                    {aiExplanation}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
