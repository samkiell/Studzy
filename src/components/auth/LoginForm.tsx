"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { login } from "@/app/auth/actions";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);

      // Call Server Action
      const result = await login(formData);

      if (result?.error) {
        setError(result.error);
        setLoading(false);
      } else {
        // Successful login will redirect from server
      }
    } catch (err) {
      console.error("Login catch error:", err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        id="identifier"
        type="text"
        label="Email or Username"
        placeholder="you@example.com or username"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="username"
      />
      <PasswordInput
        id="password"
        label="Password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete="current-password"
      />
      <div className="flex justify-end">
        <Link 
          href="/forgot-password" 
          className="text-xs font-medium text-primary-600 hover:text-primary-500"
        >
          Forgot password?
        </Link>
      </div>
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Signing in...
          </span>
        ) : (
          "Sign in"
        )}
      </Button>
    </form>
  );
}
