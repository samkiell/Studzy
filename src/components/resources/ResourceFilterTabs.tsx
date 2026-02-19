"use client";

import type { ResourceType } from "@/types/database";

export type FilterTab = "all" | ResourceType;

interface FilterTabConfig {
  key: FilterTab;
  label: string;
  icon: React.ReactNode;
  count: number;
  activeColor: string;
  activeBg: string;
  activeBorder: string;
}

interface ResourceFilterTabsProps {
  activeFilter: FilterTab;
  onFilterChange: (filter: FilterTab) => void;
  counts: {
    all: number;
    video: number;
    audio: number;
    pdf: number;
    image: number;
    document: number;
    question_bank: number;
  };
}

export function ResourceFilterTabs({
  activeFilter,
  onFilterChange,
  counts,
}: ResourceFilterTabsProps) {
  const tabs: FilterTabConfig[] = [
    {
      key: "all",
      label: "All",
      count: counts.all,
      icon: (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
      ),
      activeColor: "text-primary-700 dark:text-primary-300",
      activeBg: "bg-primary-50 dark:bg-primary-900/30",
      activeBorder: "border-primary-500 dark:border-primary-400",
    },
    {
      key: "video",
      label: "Video",
      count: counts.video,
      icon: (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      activeColor: "text-red-700 dark:text-red-300",
      activeBg: "bg-red-50 dark:bg-red-900/20",
      activeBorder: "border-red-500 dark:border-red-400",
    },
    {
      key: "audio",
      label: "Audio",
      count: counts.audio,
      icon: (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
          />
        </svg>
      ),
      activeColor: "text-purple-700 dark:text-purple-300",
      activeBg: "bg-purple-50 dark:bg-purple-900/20",
      activeBorder: "border-purple-500 dark:border-purple-400",
    },
    {
      key: "pdf",
      label: "PDF",
      count: counts.pdf,
      icon: (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      ),
      activeColor: "text-blue-700 dark:text-blue-300",
      activeBg: "bg-blue-50 dark:bg-blue-900/20",
      activeBorder: "border-blue-500 dark:border-blue-400",
    },
  ];

  return (
    <div
      className="flex flex-wrap gap-2"
      role="tablist"
      aria-label="Filter resources by type"
    >
      {tabs.map((tab) => {
        const isActive = activeFilter === tab.key;

        return (
          <button
            key={tab.key}
            id={`filter-tab-${tab.key}`}
            role="tab"
            aria-selected={isActive}
            aria-controls="resource-list-panel"
            onClick={() => onFilterChange(tab.key)}
            className={`
              group relative flex items-center gap-2 rounded-xl px-4 py-2.5
              text-sm font-medium transition-all duration-200 ease-out
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2
              dark:focus-visible:ring-offset-neutral-900
              ${
                isActive
                  ? `${tab.activeBg} ${tab.activeColor} border-2 ${tab.activeBorder} shadow-sm`
                  : "border-2 border-transparent bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-200"
              }
            `}
          >
            <span
              className={`transition-transform duration-200 ${
                isActive ? "scale-110" : "group-hover:scale-105"
              }`}
            >
              {tab.icon}
            </span>
            <span>{tab.label}</span>
            <span
              className={`
                ml-0.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5
                text-xs font-semibold transition-colors duration-200
                ${
                  isActive
                    ? `${tab.activeColor} bg-white/60 dark:bg-white/10`
                    : "bg-neutral-200 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400"
                }
              `}
            >
              {tab.count}
            </span>

          </button>
        );
      })}
    </div>
  );
}
