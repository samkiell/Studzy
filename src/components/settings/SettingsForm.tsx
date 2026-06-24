"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { 
  User, 
  Lock, 
  Sun, 
  Moon, 
  Camera, 
  Loader2, 
  Save, 
  AlertTriangle,
  CheckCircle,
  Sliders
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { updatePassword } from "@/app/auth/actions";
import { PasswordInput } from "@/components/ui/PasswordInput";

interface Profile {
  id: string;
  email: string | null;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  learning_goal: string | null;
  role: string;
}

interface SettingsFormProps {
  profile: Profile;
  initialStack?: string;
}

type TabType = "profile" | "theme" | "security";

export function SettingsForm({ profile, initialStack = "Frontend Dev" }: SettingsFormProps) {
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  
  // Profile state
  const [fullName, setFullName] = useState(profile.full_name || "");
  const [username, setUsername] = useState(profile.username || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [learningGoal, setLearningGoal] = useState(profile.learning_goal || "");
  const [stack, setStack] = useState(initialStack);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  
  // Theme state
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  
  // Security state
  const [isUpdatingPwd, setIsUpdatingPwd] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stackOptions = ["Frontend Dev", "Backend Dev", "Full Stack Dev", "UI/UX Dev", "Mobile Dev", "Game Dev"];

  // Initialize theme choice on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isDark = document.documentElement.classList.contains("dark");
      setTheme(isDark ? "dark" : "light");
    }
  }, []);

  // Avatar upload logic
  const handleAvatarClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large (max 5MB)");
      return;
    }

    setIsUploading(true);
    const uploadToast = toast.loading("Uploading new avatar...");

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/profile/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      
      setAvatarUrl(data.url);
      toast.success("Avatar updated!", { id: uploadToast });
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error(err.message || "Failed to upload avatar", { id: uploadToast });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Save profile modifications
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    const t = toast.loading("Saving changes...");

    try {
      // 1. Update profiles table
      const profileRes = await fetch("/api/profile/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          username,
          bio,
          learningGoal
        })
      });

      const profileData = await profileRes.json();
      if (!profileRes.ok) throw new Error(profileData.error || "Failed to update profile info");

      // 2. Update user metadata for stack
      const supabase = createClient();
      const { error: metaError } = await supabase.auth.updateUser({
        data: { stack }
      });

      if (metaError) throw metaError;

      toast.success("Profile saved successfully!", { id: t });
    } catch (err: any) {
      console.error("Profile save error:", err);
      toast.error(err.message || "Failed to save profile changes", { id: t });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Theme change logic
  const handleThemeChange = (newTheme: "light" | "dark") => {
    setTheme(newTheme);
    if (typeof window !== "undefined") {
      localStorage.theme = newTheme;
      if (newTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      toast.success(`Switched to ${newTheme === "dark" ? "Dark" : "Light"} Mode`);
    }
  };

  // Password reset submit handler
  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPwdError("");
    setPwdSuccess("");
    setIsUpdatingPwd(true);

    const formData = new FormData(e.currentTarget);
    const result = await updatePassword(formData);

    if (result.error) {
      setPwdError(result.error);
      toast.error(result.error);
    } else {
      setPwdSuccess(result.message || "Password updated!");
      toast.success("Password changed successfully!");
      e.currentTarget.reset();
    }
    setIsUpdatingPwd(false);
  };

  return (
    <div className="flex flex-col gap-8 md:flex-row md:items-start w-full">
      {/* Tab Navigation Menu */}
      <div className="flex w-full shrink-0 flex-row gap-1 border-b border-neutral-200 pb-2 dark:border-neutral-850 overflow-x-auto flex-nowrap md:w-64 md:flex-col md:border-b-0 md:border-r md:pb-0 md:pr-4 md:overflow-x-visible">
        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`flex flex-1 shrink-0 items-center justify-center gap-2 sm:gap-3.5 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-bold tracking-wide transition-all md:flex-none md:justify-start ${
            activeTab === "profile"
              ? "bg-primary-500/10 text-primary-600 dark:bg-primary-950/20 dark:text-primary-400"
              : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-900/50 dark:hover:text-white"
          }`}
        >
          <User className="h-4.5 w-4.5" />
          <span>Profile</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("theme")}
          className={`flex flex-1 shrink-0 items-center justify-center gap-2 sm:gap-3.5 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-bold tracking-wide transition-all md:flex-none md:justify-start ${
            activeTab === "theme"
              ? "bg-primary-500/10 text-primary-600 dark:bg-primary-950/20 dark:text-primary-400"
              : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-900/50 dark:hover:text-white"
          }`}
        >
          <Sliders className="h-4.5 w-4.5" />
          <span>Appearance</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("security")}
          className={`flex flex-1 shrink-0 items-center justify-center gap-2 sm:gap-3.5 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-bold tracking-wide transition-all md:flex-none md:justify-start ${
            activeTab === "security"
              ? "bg-primary-500/10 text-primary-600 dark:bg-primary-950/20 dark:text-primary-400"
              : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-900/50 dark:hover:text-white"
          }`}
        >
          <Lock className="h-4.5 w-4.5" />
          <span>Security</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 w-full rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/50 backdrop-blur-md overflow-hidden">
        {/* Profile Settings Tab */}
        {activeTab === "profile" && (
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Profile Details</h2>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                Update your student card metadata and display settings.
              </p>
            </div>

            <div className="flex flex-col gap-6 md:flex-row md:items-center">
              {/* Avatar Selector */}
              <div className="relative h-24 w-24 shrink-0 cursor-pointer self-center" onClick={handleAvatarClick}>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-primary-500/30 animate-[spin_30s_linear_infinite]" />
                <div className="absolute inset-1 overflow-hidden rounded-full border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-850">
                  {avatarUrl ? (
                    <div className="relative w-full h-full">
                      <Image
                        src={avatarUrl}
                        alt="Avatar"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-neutral-400 bg-neutral-100 dark:bg-neutral-800">
                      <User className="h-8 w-8" />
                    </div>
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                      <Loader2 className="h-5 w-5 animate-spin text-white" />
                    </div>
                  )}
                  {!isUploading && (
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Camera className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 space-y-1 text-center md:text-left">
                <h4 className="font-bold text-neutral-900 dark:text-white">Student Picture</h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  JPG or PNG formats under 5MB. Cloud-synchronized on upload.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAvatarClick}
                  className="mt-2 text-xs"
                >
                  Change Photo
                </Button>
              </div>
            </div>

            <hr className="border-neutral-200 dark:border-neutral-800" />

            <div className="grid gap-6 md:grid-cols-2">
              <Input
                label="Full Name"
                placeholder="e.g. John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />

              <Input
                label="Username"
                placeholder="e.g. johndoe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />

              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Engineering Stack / Role
                </label>
                <select
                  value={stack}
                  onChange={(e) => setStack(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                >
                  {stackOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Best Course (Study Focus)"
                placeholder="e.g. MTH 201"
                value={learningGoal}
                onChange={(e) => setLearningGoal(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Bio / Motto
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write a motto for your student ID card..."
                rows={3}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder-neutral-400"
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSavingProfile} className="w-full md:w-auto">
                {isSavingProfile ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Changes
              </Button>
            </div>
          </form>
        )}

        {/* Theme Preferences Tab */}
        {activeTab === "theme" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Appearance</h2>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                Choose a interface theme for your Studzy app shell.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => handleThemeChange("light")}
                className={`flex flex-col items-center gap-4 rounded-xl border p-6 text-center transition-all ${
                  theme === "light"
                    ? "border-primary-500 bg-primary-50/10 text-primary-600 dark:bg-primary-950/10 dark:text-primary-400"
                    : "border-neutral-200 bg-neutral-50 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900/40 dark:hover:bg-neutral-900/60"
                }`}
              >
                <div className="rounded-full bg-orange-100 p-3 text-orange-600 dark:bg-orange-950/20 dark:text-orange-400">
                  <Sun className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-neutral-950 dark:text-white">Light Mode</h3>
                  <p className="mt-1 text-xs text-neutral-500">Traditional white canvas design</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleThemeChange("dark")}
                className={`flex flex-col items-center gap-4 rounded-xl border p-6 text-center transition-all ${
                  theme === "dark"
                    ? "border-primary-500 bg-primary-50/10 text-primary-600 dark:bg-primary-950/10 dark:text-primary-400"
                    : "border-neutral-200 bg-neutral-50 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900/40 dark:hover:bg-neutral-900/60"
                }`}
              >
                <div className="rounded-full bg-indigo-100 p-3 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400">
                  <Moon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-neutral-950 dark:text-white">Dark Mode</h3>
                  <p className="mt-1 text-xs text-neutral-500">Premium OLED battery saving layout</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === "security" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Security Settings</h2>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                Secure your student account by updating your credentials.
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg">
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
              
              {pwdError && (
                <div className="rounded-lg bg-red-50 p-3.5 text-xs font-semibold text-red-600 dark:bg-red-900/20 dark:text-red-400 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{pwdError}</span>
                </div>
              )}
              
              {pwdSuccess && (
                <div className="rounded-lg bg-green-50 p-3.5 text-xs font-semibold text-green-600 dark:bg-green-900/20 dark:text-green-400 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  <span>{pwdSuccess}</span>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button type="submit" className="w-full md:w-auto" disabled={isUpdatingPwd}>
                  {isUpdatingPwd ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
