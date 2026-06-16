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

// Cleared for the new (Rain) semester — previous Harmattan-session exam dates
// referenced courses that have been removed. Add the new exam timetable here
// when it is published. Empty array → exam badges/countdown stay hidden.
export const EXAM_DATA: Exam[] = [];

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
