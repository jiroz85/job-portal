import React from "react";
import {
  FiGrid,
  FiBriefcase,
  FiBookmark,
  FiStar,
  FiFileText,
} from "react-icons/fi";

const TABS = [
  {
    id: "overview",
    label: "Overview",
    icon: FiGrid,
  },
  {
    id: "applications",
    label: "Applications",
    icon: FiBriefcase,
    countKey: "applications",
  },
  {
    id: "saved",
    label: "Saved Jobs",
    icon: FiBookmark,
    countKey: "saved",
  },
  {
    id: "recommended",
    label: "Recommended",
    icon: FiStar,
    countKey: "recommended",
  },
  {
    id: "resumes",
    label: "My Resumes",
    icon: FiFileText,
    countKey: "resumes",
  },
];

const DashboardTabs = ({ activeTab, onTabChange, counts = {} }) => {
  return (
    <div className="mb-8 border-b border-gray-200 dark:border-gray-700">
      {/* Scrollable Container on Mobile */}
      <div className="overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        <nav
          className="flex space-x-2 sm:space-x-3 pb-3 min-w-max"
          role="tablist"
          aria-label="Dashboard views"
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const count = tab.countKey ? counts[tab.countKey] : undefined;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                role="tab"
                id={`dashboard-tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls={`dashboard-panel-${tab.id}`}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all select-none whitespace-nowrap ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm ring-1 ring-blue-600"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700"
                }`}
              >
                <Icon
                  className={`text-sm sm:text-base flex-shrink-0 ${
                    isActive
                      ? "text-white"
                      : "text-gray-500 dark:text-gray-400 group-hover:text-blue-600"
                  }`}
                />
                <span>{tab.label}</span>

                {typeof count === "number" && count > 0 && (
                  <span
                    className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[11px] font-bold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default DashboardTabs;
