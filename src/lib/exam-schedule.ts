// ============================================
// Shared Exam Schedule Data
// ============================================

export interface Exam {
  code: string;
  title: string;
  location: string;
  date: string; // Display string
  time: string; // Display string
  startTime: string; // ISO string for countdown
  endTime: string; // ISO string to know when it's over
}

export const EXAM_DATA: Exam[] = [
  {
    code: "CSC 201",
    title: "Introduction to Python Programming",
    location: "ICT Hall",
    date: "Friday, 20th Feb, 2026",
    time: "5:00pm – 6:00pm",
    startTime: "2026-02-20T17:00:00",
    endTime: "2026-02-20T18:00:00",
  },
  {
    code: "MTH 201",
    title: "Mathematical Foundations",
    location: "ICT Hall",
    date: "Saturday, 21st Feb, 2026",
    time: "8:00am – 9:00am",
    startTime: "2026-02-21T08:00:00",
    endTime: "2026-02-21T09:00:00",
  },
  {
    code: "STT 201",
    title: "Statistics & Probability",
    location: "ICT Hall",
    date: "Wednesday, 4th March, 2026",
    time: "1:00pm – 2:00pm",
    startTime: "2026-03-04T13:00:00",
    endTime: "2026-03-04T14:00:00",
  },
  {
    code: "CPE 203",
    title: "Computer Engineering Foundations",
    location: "Chemical Engineering LT",
    date: "Wednesday, 25th Feb, 2026",
    time: "4:00pm – 7:00pm",
    startTime: "2026-02-25T16:00:00",
    endTime: "2026-02-25T19:00:00",
  },
  {
    code: "SEN 205",
    title: "Software Engineering Principles",
    location: "BOO B",
    date: "Saturday, 7th March, 2026",
    time: "12:00pm – 3:00pm",
    startTime: "2026-03-07T12:00:00",
    endTime: "2026-03-07T15:00:00",
  },
  {
    code: "SEN 203",
    title: "Data Structures & Algorithms",
    location: "Seminar Room (A, B, C, D)",
    date: "Tuesday, 10th March, 2026",
    time: "8:00am – 11:00am",
    startTime: "2026-03-10T08:00:00",
    endTime: "2026-03-10T11:00:00",
  },
  {
    code: "SEN 201",
    title: "Introduction to Software Engineering",
    location: "Seminar Room (A, B, C, D)",
    date: "Friday, 13th March, 2026",
    time: "4:00pm – 7:00pm",
    startTime: "2026-03-13T16:00:00",
    endTime: "2026-03-13T19:00:00",
  },
];

/**
 * Get the exam schedule entry for a course by its code.
 */
export function getExamForCourse(courseCode: string): Exam | undefined {
  return EXAM_DATA.find(
    (e) => e.code.toLowerCase() === courseCode.toLowerCase()
  );
}

/**
 * Check if a course exam has passed (endTime is in the past).
 */
export function isExamPassed(courseCode: string, now: Date = new Date()): boolean {
  const exam = getExamForCourse(courseCode);
  if (!exam) return false;
  return new Date(exam.endTime) < now;
}

/**
 * Get the exam date display string for a course (if it has one).
 */
export function getExamDate(courseCode: string): string | null {
  const exam = getExamForCourse(courseCode);
  return exam ? exam.date : null;
}
