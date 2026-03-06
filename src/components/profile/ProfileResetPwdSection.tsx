"use client";

import { useEffect, useRef } from "react";
import { Lock } from "lucide-react";
import { UpdatePasswordForm } from "@/components/auth/UpdatePasswordForm";

export function ProfileResetPwdSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.location.hash === "#reset-pwd" && sectionRef.current) {
      // Short delay to ensure the page is fully rendered
      setTimeout(() => {
        sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    }
  }, []);

  return (
    <div
      ref={sectionRef}
      id="reset-pwd"
      className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div className="flex items-center gap-2 mb-4">
        <Lock className="h-5 w-5 text-primary-600" />
        <h3 className="font-bold text-neutral-900 dark:text-white">
          Change Password
        </h3>
      </div>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-5">
        Enter your new password below. It must be at least 6 characters.
      </p>
      <UpdatePasswordForm />
    </div>
  );
}
