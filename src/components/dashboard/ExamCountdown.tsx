"use client";

import { useEffect, useState, useMemo } from "react";
import { Clock, MapPin, Calendar, Timer } from "lucide-react";

interface Exam {
  code: string;
  location: string;
  date: string; // ISO string or parsable date
  time: string; // Display string for time
  startTime: string; // ISO string for countdown
  endTime: string; // ISO string to know when to remove
}

const EXAM_DATA: Exam[] = [
  {
    code: "CSC 201",
    location: "ICT Hall",
    date: "Friday, 20th Feb, 2026",
    time: "5:00pm – 6:00pm",
    startTime: "2026-02-20T17:00:00",
    endTime: "2026-02-20T18:00:00",
  },
  {
    code: "MTH 201",
    location: "ICT Hall",
    date: "Saturday, 21st Feb, 2026",
    time: "8:00am – 9:00am",
    startTime: "2026-02-21T08:00:00",
    endTime: "2026-02-21T09:00:00",
  },
  {
    code: "STT 201",
    location: "ICT Hall",
    date: "Wednesday, 4th March, 2026",
    time: "1:00pm – 2:00pm",
    startTime: "2026-03-04T13:00:00",
    endTime: "2026-03-04T14:00:00",
  },
  {
    code: "CPE 203",
    location: "Chemical Engineering LT",
    date: "Wednesday, 4th March, 2026",
    time: "4:00pm – 7:00pm",
    startTime: "2026-03-04T16:00:00",
    endTime: "2026-03-04T19:00:00",
  },
  {
    code: "SEN 205",
    location: "BOO B",
    date: "Saturday, 7th March, 2026",
    time: "12:00pm – 3:00pm",
    startTime: "2026-03-07T12:00:00",
    endTime: "2026-03-07T15:00:00",
  },
  {
    code: "SEN 203",
    location: "Seminar Room (A, B, C, D)",
    date: "Tuesday, 10th March, 2026",
    time: "8:00am – 11:00am",
    startTime: "2026-03-10T08:00:00",
    endTime: "2026-03-10T11:00:00",
  },
  {
    code: "SEN 201",
    location: "Seminar Room (A, B, C, D)",
    date: "Friday, 13th March, 2026",
    time: "4:00pm – 7:00pm",
    startTime: "2026-03-13T16:00:00",
    endTime: "2026-03-13T19:00:00",
  },
];

export function ExamCountdown() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const upcomingExams = useMemo(() => {
    return EXAM_DATA.filter((exam) => new Date(exam.endTime) > now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 2);
  }, [now]);

  if (upcomingExams.length === 0) return null;

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
      
      <div className="grid gap-4 sm:grid-cols-2">
        {upcomingExams.map((exam) => (
          <ExamCard key={exam.code} exam={exam} now={now} />
        ))}
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
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {exam.code}
            </h3>
            <p className="mt-1 text-sm font-medium text-primary-600 dark:text-primary-400">
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
            style={{ width: `${(Math.random() * 20) + 80}%` }} // Simplified visual logic
          />
        </div>
      )}
    </div>
  );
}
