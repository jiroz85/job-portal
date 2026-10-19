import React from "react";
import { Link } from "react-router-dom";
import {
  FiGrid,
  FiBriefcase,
  FiBookmark,
  FiStar,
  FiFileText,
  FiX,
  FiLogOut,
} from "react-icons/fi";

const JobSeekerSidebar = ({
  isOpen = false,
  toggleSidebar,
  activeTab = "overview",
  onTabChange,
  counts = {},
  user,
  onLogout,
}) => {
  const getInitials = () => {
    if (user?.name) {
      const parts = user.name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return user.name.slice(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "JS";
  };

  const navItems = [
    {
      id: "overview",
      name: "Dashboard Overview",
      icon: FiGrid,
    },
    {
      id: "applications",
      name: "My Applications",
      icon: FiBriefcase,
      count: counts.applications,
    },
    {
      id: "saved",
      name: "Saved Jobs",
      icon: FiBookmark,
      count: counts.saved,
    },
    {
      id: "recommended",
      name: "Recommended Jobs",
      icon: FiStar,
      count: counts.recommended,
    },
    {
      id: "resumes",
      name: "My Resumes",
      icon: FiFileText,
      count: counts.resumes,
    },
  ];

  const handleSelectTab = (tabId) => {
    if (typeof onTabChange === "function") {
      onTabChange(tabId);
    }
    if (typeof toggleSidebar === "function" && isOpen) {
      toggleSidebar();
    }
  };

  return (
    <aside
      aria-label="Job Seeker Navigation"
      className={`fixed inset-y-0 left-0 transform ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-xl z-50 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0`}
    >
      {/* Brand Header */}
      <div>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <Link
            to="/dashboard"
            onClick={() => handleSelectTab("overview")}
            className="flex items-center space-x-3 group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform shrink-0">
              <FiBriefcase className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-base font-bold text-gray-900 dark:text-white tracking-tight block truncate">
                Candidate Hub
              </span>
              <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium block">
                Job Seeker Portal
              </span>
            </div>
          </Link>
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close sidebar"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Navigation */}
        <nav className="px-3 py-4 overflow-y-auto">
          <p className="px-3 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
            Workspace
          </p>
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => handleSelectTab(item.id)}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex items-center justify-between w-full px-3.5 py-2.5 text-xs sm:text-sm font-medium rounded-xl transition-all duration-150 ${
                      isActive
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold shadow-2xs border-l-4 border-blue-600 dark:border-blue-500"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-700/60 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    <span className="flex items-center">
                      <Icon
                        className={`w-4 h-4 mr-3 flex-shrink-0 ${
                          isActive
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-gray-400 dark:text-gray-400"
                        }`}
                      />
                      <span>{item.name}</span>
                    </span>
                    {typeof item.count === "number" && item.count > 0 && (
                      <span
                        className={`px-2 py-0.5 text-[11px] font-semibold rounded-full ${
                          isActive
                            ? "bg-blue-200 text-blue-900 dark:bg-blue-900 dark:text-blue-200"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {item.count}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Profile & Logout Section at Bottom */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/40 shrink-0">
        <div className="flex items-center space-x-3 mb-3 p-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200/80 dark:border-gray-700 shadow-2xs">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs tracking-wider shrink-0 shadow-xs">
            {getInitials()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
              {user?.name || "Job Seeker"}
            </p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
              {user?.email || "candidate@jobportal.com"}
            </p>
            <span className="inline-block mt-0.5 px-1.5 py-0.2 text-[9px] uppercase font-bold tracking-wider rounded bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
              Candidate
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors border border-red-200 dark:border-red-900/60"
        >
          <FiLogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default JobSeekerSidebar;
