"use client";

import { useState } from "react";
import { Loader2, Save, User as UserIcon, Edit2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface ProfileEditorProps {
  initialBio: string | null;
  initialGoal: string | null;
  onUpdate?: () => void;
}

export function ProfileEditor({ initialBio, initialGoal, onUpdate }: ProfileEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
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
        setTimeout(() => {
          setIsOpen(false);
          setMessage(null);
        }, 1500);
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
    <>
      <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-primary-600" />
            <h3 className="font-bold text-neutral-900 dark:text-white">Profile Settings</h3>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsOpen(true)}
            className="text-xs h-8"
          >
            <Edit2 className="h-3 w-3 mr-1" />
            Edit
          </Button>
        </div>
      </div>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Edit Profile"
        description="Update your personal details below."
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1 block">Short Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us a bit about yourself..."
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              rows={3}
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1 block">Best Course</label>
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. MTH 201"
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            />
          </div>

          {message && (
            <div className={`rounded-lg p-3 text-sm font-medium ${message.type === 'success' ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"}`}>
              {message.text}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
             <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
             <Button
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

