"use client";

import { Brain, Zap, Sparkles, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLoading } from "@/components/providers/LoadingProvider";

export default function StudzyAIPage() {
  const router = useRouter();
  const { startLoading, stopLoading } = useLoading();
  const [error, setError] = useState<string | null>(null);

  const tools = [
    {
      title: "AI Exam Predictor",
      description: "Get predicted exam questions based on your course materials.",
      icon: <Sparkles className="h-6 w-6 text-amber-500" />,
      href: "/ai-exam-predictor",
      color: "bg-amber-50 dark:bg-amber-900/10"
    },
    {
      title: "Flashcard Generator",
      description: "Instantly create study flashcards from PDFs and notes.",
      icon: <Zap className="h-6 w-6 text-primary-500" />,
      href: "/ai-flashcard-generator",
      color: "bg-primary-50 dark:bg-primary-900/10"
    },
    {
      title: "Quiz Master",
      description: "Test your knowledge with AI-generated practice quizzes.",
      icon: <Brain className="h-6 w-6 text-purple-500" />,
      href: "/ai-quiz-generator",
      color: "bg-purple-50 dark:bg-purple-900/10"
    }
  ];

  const handleStartChat = async () => {
    startLoading();
    setError(null);
    try {
      const res = await fetch("/api/ai/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Chat" }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/studzyai/chat/${data.session.id}`);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to start a new chat session.");
        stopLoading();
      }
    } catch {
      setError("Network error. Please try again.");
      stopLoading();
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white sm:text-3xl font-black italic">
          STUDZY AI
        </h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400 max-w-2xl">
          Supercharge your learning with our suite of AI-powered study tools. Designed to help you understand better and memorize faster.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <Link 
            key={tool.title} 
            href={tool.href}
            className="group block rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:scale-[1.02] hover:shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${tool.color}`}>
              {tool.icon}
            </div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {tool.title}
            </h3>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              {tool.description}
            </p>
            <div className="mt-6 flex items-center gap-2 text-sm font-bold text-primary-600 dark:text-primary-400">
              <span>Get Started</span>
              <Sparkles className="h-4 w-4 transition-transform group-hover:rotate-12" />
            </div>
          </Link>
        ))}
      </div>

      {/* Main Chat Promo */}
      <div className="relative overflow-hidden rounded-3xl bg-neutral-900 p-8 text-white dark:bg-primary-900/10 dark:border dark:border-primary-900/20">
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h2 className="text-xl font-bold md:text-2xl flex items-center gap-2">
              <MessageCircle className="h-6 w-6 text-primary-400" />
              Direct AI Consultation
            </h2>
            <p className="text-neutral-400 dark:text-neutral-300 max-w-xl">
              Have a specific question about your 200-level courses? Chat directly with Studzy AI for instant explanations.
            </p>
          </div>
          <button 
            onClick={handleStartChat}
            className="rounded-2xl bg-primary-600 px-8 py-4 font-bold text-white transition-all hover:bg-primary-700 active:scale-95 shadow-lg shadow-primary-500/20"
          >
            Open Chat
          </button>
        </div>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary-600/20 blur-3xl" />
      </div>
    </div>
  );
}
