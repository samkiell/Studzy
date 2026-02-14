"use client";

import { useState } from "react";
import { updatePassword } from "@/app/auth/actions";
import { Button } from "@/components/ui/Button";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { useRouter } from "next/navigation";
import { Modal, useModal } from "@/components/ui/Modal";

export function UpdatePasswordForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const errorModal = useModal();
  const successModal = useModal();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await updatePassword(formData);

    if (result.error) {
      setError(result.error);
      errorModal.open();
    } else {
      successModal.open();
      setTimeout(() => {
        router.push("/dashboard");
      }, 3000);
    }
    setLoading(false);
  };

  return (
    <>
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
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Updating..." : "Update Password"}
        </Button>
      </form>

      {/* Success Modal */}
      <Modal
        isOpen={successModal.isOpen}
        onClose={successModal.close}
        type="success"
        title="Password Updated"
        description="Your password has been changed successfully. You will be redirected to the dashboard shortly."
        footer={
          <Button onClick={() => router.push("/dashboard")} className="w-full">
            Go to Dashboard
          </Button>
        }
      />

      {/* Error Modal */}
      <Modal
        isOpen={errorModal.isOpen}
        onClose={errorModal.close}
        type="error"
        title="Update Failed"
        description={error}
        footer={
          <Button onClick={errorModal.close} className="w-full">
            Try Again
          </Button>
        }
      />
    </>
  );
}
