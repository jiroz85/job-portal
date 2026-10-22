import React from "react";
import {
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiBookmark,
  FiUpload,
  FiArrowRight,
} from "react-icons/fi";

const DashboardHeader = ({ user, stats, onTabChange }) => {
  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "JS";

  return (
    <div className="mb-8">
      {/* Top Banner Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 shadow-sm transition-colors mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* User Profile Info */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xl flex items-center justify-center shadow-md flex-shrink-0">
              {userInitials}
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                  Welcome back, {user?.name || "Job Seeker"}!
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 uppercase tracking-wide">
                  Candidate
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
                <span>{user?.email}</span>
                <span className="hidden sm:inline text-gray-300 dark:text-gray-600">•</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Manage your applications, active interviews, and credentials
                </span>
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => onTabChange("resumes")}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-200 font-semibold text-xs shadow-sm transition-colors cursor-pointer"
            >
              <FiUpload className="text-sm text-blue-600 dark:text-blue-400" />
              <span>Manage Resumes</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange("recommended")}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer"
            >
              <FiBriefcase className="text-sm" />
              <span>Explore Opportunities</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards Grid (Interactive navigation cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Applications */}
        <button
          type="button"
          onClick={() => onTabChange("applications", "all")}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500/60 dark:hover:border-blue-500/60 p-5 shadow-sm hover:shadow-md transition-all text-left group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Applications
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mt-1">
                {stats?.applied ?? 0}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-105 transition-transform">
              <FiBriefcase />
            </div>
          </div>
          <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
            <span>View all submitted</span>
            <FiArrowRight className="text-xs group-hover:translate-x-1 transition-transform text-blue-500" />
          </div>
        </button>

        {/* Interviews Scheduled */}
        <button
          type="button"
          onClick={() => onTabChange("applications", "interview")}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-amber-500/60 dark:hover:border-amber-500/60 p-5 shadow-sm hover:shadow-md transition-all text-left group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                Interviews
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                {stats?.interviews ?? 0}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-105 transition-transform">
              <FiCalendar />
            </div>
          </div>
          <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
            <span>Active interview stage</span>
            <FiArrowRight className="text-xs group-hover:translate-x-1 transition-transform text-amber-500" />
          </div>
        </button>

        {/* Job Offers */}
        <button
          type="button"
          onClick={() => onTabChange("applications", "offered")}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 p-5 shadow-sm hover:shadow-md transition-all text-left group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Job Offers
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                {stats?.offers ?? 0}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-105 transition-transform">
              <FiCheckCircle />
            </div>
          </div>
          <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
            <span>Received offers</span>
            <FiArrowRight className="text-xs group-hover:translate-x-1 transition-transform text-emerald-500" />
          </div>
        </button>

        {/* Saved Jobs */}
        <button
          type="button"
          onClick={() => onTabChange("saved")}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-500/60 dark:hover:border-purple-500/60 p-5 shadow-sm hover:shadow-md transition-all text-left group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                Saved Jobs
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold text-purple-600 dark:text-purple-400 mt-1">
                {stats?.saved ?? 0}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-105 transition-transform">
              <FiBookmark />
            </div>
          </div>
          <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
            <span>Bookmarked listings</span>
            <FiArrowRight className="text-xs group-hover:translate-x-1 transition-transform text-purple-500" />
          </div>
        </button>
      </div>
    </div>
  );
};

export default DashboardHeader;
