"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signup } from "@/app/auth/actions";
import { ResendButton } from "@/components/auth/ResendButton";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";

export function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      });
      if (err) {
        setError(err.message);
        setGoogleLoading(false);
      }
    } catch (err: any) {
      console.error("Google sign in error:", err);
      setError("An unexpected error occurred. Please try again.");
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !username || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("username", username);
      formData.append("password", password);
      formData.append("confirmPassword", confirmPassword);

      const result = await signup(formData);

      if (result?.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      if (result?.success) {
        setSuccess(true);
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center dark:border-green-800 dark:bg-green-900/20">
        <svg className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="mt-4 text-lg font-semibold text-green-900 dark:text-green-100">Check your email</h3>
        <p className="mt-2 text-sm text-green-700 dark:text-green-300">
          We&apos;ve sent a confirmation link to <strong>{email}</strong>. Click the link to activate your account.
        </p>
        <div className="mt-6">
          <ResendButton email={email} />
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        id="email"
        type="email"
        label="Email"
        placeholder="exam@sorting.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
      />
      <Input
        id="username"
        type="text"
        label="Username"
        placeholder="e.g. CPE Lecturer"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
        autoComplete="off"
      />
      <PasswordInput
        id="password"
        label="Password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete="new-password"
      />
      <PasswordInput
        id="confirmPassword"
        label="Confirm Password"
        placeholder="••••••••"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        autoComplete="new-password"
      />
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}
      <Button type="submit" className="w-full" disabled={loading || googleLoading}>
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Creating account...
          </span>
        ) : (
          "Create account"
        )}
      </Button>

      <div className="relative flex items-center justify-center my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-neutral-200 dark:border-neutral-800" />
        </div>
        <span className="relative bg-neutral-50 px-2 text-xs text-neutral-500 dark:bg-neutral-950 dark:text-neutral-400">
          Or continue with
        </span>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full flex items-center justify-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"
        onClick={handleGoogleSignIn}
        disabled={loading || googleLoading}
      >
        {googleLoading ? (
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Redirecting to Google...
          </span>
        ) : (
          <>
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.53-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-8.72z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.08 1.16-3.14 0-5.8-2.11-6.75-4.96H1.31v3.15C3.29 22.28 7.4 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.25 14.24a7.17 7.17 0 010-4.48V6.61H1.31a11.94 11.94 0 000 10.78l3.94-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.4 0 3.29 1.72 1.31 4.75l3.94 3.15C6.2 4.98 8.86 4.75 12 4.75z"
              />
            </svg>
            Continue with Google
          </>
        )}
      </Button>

      <p className="text-center text-xs text-neutral-500 dark:text-neutral-400">
        By signing up, you agree that you will not cheat on the day of the exam, if you do.. walai dem go catch you!
      </p>
    </form>
  );
}
