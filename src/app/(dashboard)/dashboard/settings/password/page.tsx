import { UpdatePasswordForm } from "@/components/auth/UpdatePasswordForm";

export default function UpdatePasswordPage() {
  return (
    <div className="container mx-auto max-w-md py-12">
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h1 className="mb-6 text-2xl font-bold text-neutral-900 dark:text-white">
          Update Password
        </h1>
        <p className="mb-8 text-sm text-neutral-600 dark:text-neutral-400">
          Set a new password for your account. Make sure it's secure.
        </p>
        <UpdatePasswordForm />
      </div>
    </div>
  );
}
