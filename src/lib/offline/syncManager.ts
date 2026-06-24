import { 
  getPendingSyncAttempts, 
  deleteOfflineAttempt 
} from "./offlineDb";
import { syncOfflineAttempt } from "@/app/(dashboard)/cbt/actions";
import { toast } from "react-hot-toast";

let isSyncing = false;

export async function syncPendingAttempts() {
  if (typeof window === "undefined" || !navigator.onLine || isSyncing) return;

  try {
    const pending = await getPendingSyncAttempts();
    if (!pending || pending.length === 0) return;

    isSyncing = true;
    toast.loading("Syncing offline CBT results...", { id: "offline-sync" });

    let successCount = 0;
    for (const attempt of pending) {
      try {
        await syncOfflineAttempt({
          course_id: attempt.course_id,
          mode: attempt.mode,
          total_questions: attempt.total_questions,
          score: (attempt as any).score || 0,
          duration_seconds: (attempt as any).duration_seconds || 0,
          time_limit_seconds: attempt.time_limit_seconds || null,
          question_ids: attempt.question_ids,
          answers: attempt.answers,
          theoryAnswers: attempt.theoryAnswers,
          questionDurations: attempt.questionDurations,
          started_at: (attempt as any).started_at,
          completed_at: (attempt as any).completed_at,
        });

        // Clean up locally synced attempt
        await deleteOfflineAttempt(attempt.id);
        successCount++;
      } catch (err) {
        console.error(`Failed to sync attempt ${attempt.id}:`, err);
      }
    }

    if (successCount > 0) {
      toast.success(`Successfully synced ${successCount} offline CBT session${successCount > 1 ? "s" : ""}!`, { id: "offline-sync" });
    } else {
      toast.error("Failed to sync offline results.", { id: "offline-sync" });
    }
  } catch (error) {
    console.error("Offline sync error:", error);
    toast.dismiss("offline-sync");
  } finally {
    isSyncing = false;
  }
}

export function initOfflineSync() {
  if (typeof window === "undefined") return;

  // Add listeners
  window.addEventListener("online", syncPendingAttempts);
  
  // Trigger initial sync check
  if (navigator.onLine) {
    syncPendingAttempts();
  }
}
