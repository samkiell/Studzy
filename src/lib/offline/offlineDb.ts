import { Question, Attempt } from "@/types/cbt";
import { Course } from "@/types/database";

const DB_NAME = "studzy-offline";
const DB_VERSION = 1;

export interface OfflineAttempt extends Omit<Attempt, "id"> {
  id: string; // Will support offline_ prefix
  answers: Record<string, string>;
  theoryAnswers?: Record<string, { main?: string; sub: Record<string, string> }>;
  questionDurations: Record<string, number>;
  pending_sync: boolean;
  question_ids: string[];
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("IndexedDB is only available in browser environments."));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = request.result;

      // 1. Courses store
      if (!db.objectStoreNames.contains("courses")) {
        db.createObjectStore("courses", { keyPath: "id" });
      }

      // 2. Questions store (indexed by course_id)
      if (!db.objectStoreNames.contains("questions")) {
        const questionStore = db.createObjectStore("questions", { keyPath: "id" });
        questionStore.createIndex("course_id", "course_id", { unique: false });
      }

      // 3. Attempts store
      if (!db.objectStoreNames.contains("attempts")) {
        db.createObjectStore("attempts", { keyPath: "id" });
      }
    };
  });
}

// ─── COURSES STORAGE ───────────────────────────────────────────────

export async function saveCoursesOffline(courses: Course[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("courses", "readwrite");
    const store = tx.objectStore("courses");

    courses.forEach((course) => {
      store.put(course);
    });

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getOfflineCourses(): Promise<Course[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("courses", "readonly");
    const store = tx.objectStore("courses");
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteOfflineCourse(courseId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(["courses", "questions"], "readwrite");
    
    // Delete course metadata
    tx.objectStore("courses").delete(courseId);

    // Delete all questions associated with the course
    const qStore = tx.objectStore("questions");
    const index = qStore.index("course_id");
    const request = index.openCursor(IDBKeyRange.only(courseId));

    request.onsuccess = (event: any) => {
      const cursor = event.target.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ─── QUESTIONS STORAGE ─────────────────────────────────────────────

export async function saveQuestionsOffline(courseId: string, questions: Question[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("questions", "readwrite");
    const store = tx.objectStore("questions");

    questions.forEach((q) => {
      // Force match type just in case
      store.put({
        ...q,
        course_id: courseId,
      });
    });

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getOfflineQuestions(courseId: string): Promise<Question[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("questions", "readonly");
    const store = tx.objectStore("questions");
    const index = store.index("course_id");
    const request = index.getAll(IDBKeyRange.only(courseId));

    request.onsuccess = () => resolve(request.result as Question[]);
    request.onerror = () => reject(request.error);
  });
}

export async function getDownloadedCourseIds(): Promise<string[]> {
  const courses = await getOfflineCourses();
  return courses.map(c => c.id);
}

// ─── ATTEMPTS STORAGE ──────────────────────────────────────────────

export async function saveOfflineAttempt(attempt: OfflineAttempt): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("attempts", "readwrite");
    const store = tx.objectStore("attempts");
    store.put(attempt);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getOfflineAttempt(attemptId: string): Promise<OfflineAttempt | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("attempts", "readonly");
    const store = tx.objectStore("attempts");
    const request = store.get(attemptId);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function getPendingSyncAttempts(): Promise<OfflineAttempt[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("attempts", "readonly");
    const store = tx.objectStore("attempts");
    const request = store.getAll();

    request.onsuccess = () => {
      const all: OfflineAttempt[] = request.result || [];
      resolve(all.filter((a) => a.pending_sync));
    };
    request.onerror = () => reject(request.error);
  });
}

export async function deleteOfflineAttempt(attemptId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("attempts", "readwrite");
    const store = tx.objectStore("attempts");
    store.delete(attemptId);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
