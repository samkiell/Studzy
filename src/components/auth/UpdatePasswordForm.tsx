"use client";

import { useState } from "react";
import { updatePassword } from "@/app/auth/actions";
import { Button } from "@/components/ui/Button";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { useRouter } from "next/navigation";

export function UpdatePasswordForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await updatePassword(formData);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(result.message || "Password updated!");
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PasswordInput
        name="password"
        id="password"
        label="New Password"
        placeholder="••••••••"
        required
      />
      <PasswordInput
        name="confirmPassword"
        id="confirmPassword"
        label="Confirm New Password"
        placeholder="••••••••"
        required
      />
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600 dark:bg-green-900/20 dark:text-green-400">
          {success}
        </div>
      )}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Updating..." : "Update Password"}
      </Button>
    </form>
  );
}
