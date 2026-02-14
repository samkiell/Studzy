"use client";

import { useState } from "react";
import { resendConfirmation } from "@/app/auth/actions";
import { Button } from "@/components/ui/Button";

export function ResendButton({ email }: { email: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleResend = async () => {
    setLoading(true);
    setMessage("");
    setError("");

    const result = await resendConfirmation(email);

    if (result.error) {
      setError(result.error);
    } else {
      setMessage(result.message || "Confirmation email sent!");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <Button 
        variant="outline" 
        onClick={handleResend} 
        disabled={loading}
        className="w-full"
      >
        {loading ? "Resending..." : "Resend Confirmation Email"}
      </Button>
      {message && <p className="text-sm text-green-600 dark:text-green-400">{message}</p>}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
