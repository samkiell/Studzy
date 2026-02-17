import { Settings as SettingsIcon, Bell, Moon, Shield, Sparkles } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white sm:text-3xl">
          Settings
        </h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          Customize your Studzy experience.
        </p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        <SettingsCard 
          icon={<Bell className="h-5 w-5 text-blue-600" />}
          title="Notifications"
          description="Manage how you receive updates and alerts."
        />
        <SettingsCard 
          icon={<Moon className="h-5 w-5 text-purple-600" />}
          title="Appearance"
          description="Toggle between light and dark mode preferences."
        />
        <SettingsCard 
          icon={<Shield className="h-5 w-5 text-green-600" />}
          title="Privacy & Security"
          description="Control your data and account security."
        />
        <SettingsCard 
          icon={<Sparkles className="h-5 w-5 text-amber-600" />}
          title="AI Preferences"
          description="Adjust how StudzyAI interacts with your data."
        />
      </div>
    </div>
  );
}

function SettingsCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800/50">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-neutral-900 dark:text-white">{title}</h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">{description}</p>
        </div>
      </div>
      <button className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
        Edit
      </button>
    </div>
  );
}
