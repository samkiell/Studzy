"use client";

import { useEffect, useState, useMemo } from "react";
import { Clock, MapPin, Calendar, Timer, CheckCircle2 } from "lucide-react";
import { EXAM_DATA, type Exam } from "@/lib/exam-schedule";

export function ExamCountdown() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Show upcoming exams + recently passed exams (ended within last 2 days)
  const { upcoming, recentlyPassed } = useMemo(() => {
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const sorted = [...EXAM_DATA].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    return {
      upcoming: sorted.filter((e) => new Date(e.endTime) > now).slice(0, 2),
      recentlyPassed: sorted
        .filter((e) => new Date(e.endTime) <= now && new Date(e.endTime) >= twoDaysAgo)
        .slice(0, 2),
    };
  }, [now]);

  if (upcoming.length === 0 && recentlyPassed.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-neutral-900 dark:text-white sm:text-lg flex items-center gap-2">
          <Timer className="h-5 w-5 text-primary-500" />
          Exam Countdown
        </h2>
        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full">
          Harmattan Session
        </span>
      </div>

      {/* Recently passed exams shown first with a "Passed" badge */}
      {recentlyPassed.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {recentlyPassed.map((exam) => (
            <PassedExamCard key={exam.code} exam={exam} />
          ))}
        </div>
      )}

      {/* Upcoming exams */}
      {upcoming.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {upcoming.map((exam) => (
            <ExamCard key={exam.code} exam={exam} now={now} />
          ))}
        </div>
      )}
    </div>
  );
}

function PassedExamCard({ exam }: { exam: Exam }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-neutral-200/60 bg-neutral-50 dark:border-neutral-800/60 dark:bg-neutral-900/50 opacity-75">
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 bg-neutral-200 dark:bg-neutral-800 px-1.5 py-0.5 rounded uppercase">
                {exam.code}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded uppercase">
                <CheckCircle2 className="h-2.5 w-2.5" />
                Passed
              </span>
            </div>
            <h3 className="mt-1 text-sm font-bold text-neutral-500 dark:text-neutral-400 line-clamp-1">
              {exam.title}
            </h3>
            <p className="mt-0.5 text-[11px] font-medium text-neutral-400 dark:text-neutral-500">
              Exam completed
            </p>
          </div>
          <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 text-emerald-500 dark:text-emerald-400 shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-4 space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-neutral-400 dark:text-neutral-500">
            <Calendar className="h-3.5 w-3.5" />
            <span>{exam.date}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-400 dark:text-neutral-500">
            <Clock className="h-3.5 w-3.5" />
            <span>{exam.time}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-400 dark:text-neutral-500">
            <MapPin className="h-3.5 w-3.5" />
            <span className="truncate">{exam.location}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExamCard({ exam, now }: { exam: Exam; now: Date }) {
  const timeLeft = useMemo(() => {
    const start = new Date(exam.startTime).getTime();
    const diff = start - now.getTime();

    if (diff <= 0) return "In Progress";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    return `${days}d ${hours}h ${mins}m ${secs}s`;
  }, [exam, now]);

  const isSoon = useMemo(() => {
    const start = new Date(exam.startTime).getTime();
    const diff = start - now.getTime();
    return diff > 0 && diff < 1000 * 60 * 60 * 24; // Less than 24h
  }, [exam, now]);

  return (
    <div className={`relative group overflow-hidden rounded-2xl border transition-all duration-300 ${
      isSoon
        ? "border-primary-200 bg-primary-50/50 dark:border-primary-800/50 dark:bg-primary-900/10 shadow-lg shadow-primary-500/5 scale-[1.02]"
        : "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 hover:shadow-md"
    }`}>
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/30 px-1.5 py-0.5 rounded uppercase">
                {exam.code}
              </span>
            </div>
            <h3 className="mt-1 text-sm font-bold text-neutral-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-1">
              {exam.title}
            </h3>
            <p className="mt-0.5 text-[11px] font-medium text-primary-600 dark:text-primary-400">
              {timeLeft === "In Progress" ? "EXAM IS ONGOING" : `Starts in ${timeLeft}`}
            </p>
          </div>
          <div className={`p-2 rounded-xl ${
            isSoon ? "bg-primary-100 text-primary-600 dark:bg-primary-900/40" : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
          }`}>
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
            <Calendar className="h-3.5 w-3.5" />
            <span>{exam.date}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
            <Clock className="h-3.5 w-3.5" />
            <span>{exam.time}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
            <MapPin className="h-3.5 w-3.5" />
            <span className="truncate">{exam.location}</span>
          </div>
        </div>
      </div>

      {/* Animated progress bar for remaining time (visual only) */}
      {isSoon && timeLeft !== "In Progress" && (
        <div className="absolute bottom-0 left-0 h-1 bg-primary-500/20 w-full overflow-hidden">
          <div
            className="h-full bg-primary-500 animate-pulse transition-all duration-1000"
            style={{ width: `${(Math.random() * 20) + 80}%` }}
          />
        </div>
      )}
    </div>
  );
}
