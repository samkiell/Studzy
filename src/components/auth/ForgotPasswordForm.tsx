"use client";

import { useState } from "react";
import { resetPassword } from "@/app/auth/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal, useModal } from "@/components/ui/Modal";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const errorModal = useModal();
  const successModal = useModal();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await resetPassword(email);

    if (result.error) {
      setError(result.error);
      errorModal.open();
    } else {
      successModal.open();
    }
    setLoading(false);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="email"
          type="email"
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Sending..." : "Send Reset Link"}
        </Button>
      </form>

      {/* Success Modal */}
      <Modal
        isOpen={successModal.isOpen}
        onClose={successModal.close}
        type="success"
        title="Check your email"
        description="We've sent a password reset link to your email address. It should arrive shortly."
        footer={
          <Button onClick={successModal.close} className="w-full">
            Got it
          </Button>
        }
      />

      {/* Error Modal */}
      <Modal
        isOpen={errorModal.isOpen}
        onClose={errorModal.close}
        type="error"
        title="Request Failed"
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
