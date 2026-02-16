"use client";

import { useState } from "react";
import { Loader2, Save, User as UserIcon } from "lucide-react";

interface ProfileEditorProps {
  initialBio: string | null;
  initialGoal: string | null;
  onUpdate?: () => void;
}

export function ProfileEditor({ initialBio, initialGoal, onUpdate }: ProfileEditorProps) {
  const [bio, setBio] = useState(initialBio || "");
  const [goal, setGoal] = useState(initialGoal || "");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/profile/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio, learningGoal: goal }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: "Profile updated successfully!" });
        if (onUpdate) onUpdate();
      } else {
        throw new Error("Failed to update profile");
      }
    } catch (err) {
      setMessage({ type: 'error', text: "Something went wrong. Please try again." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center gap-2 mb-2">
        <UserIcon className="h-5 w-5 text-primary-600" />
        <h3 className="font-bold text-neutral-900 dark:text-white">Edit Profile</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1 block">Short Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us a bit about yourself..."
            className="w-full rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            rows={2}
          />
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1 block">Learning Goal</label>
          <input
            type="text"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="What are you studying towards?"
            className="w-full rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
          />
        </div>

        {message && (
          <p className={`text-xs font-medium ${message.type === 'success' ? "text-green-600" : "text-red-600"}`}>
            {message.text}
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 py-2.5 text-sm font-bold text-white transition-all hover:bg-primary-700 disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
}
