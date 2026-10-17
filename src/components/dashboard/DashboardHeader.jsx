import React from "react";
import { Link } from "react-router-dom";
import {
  FiBriefcase,
  FiUser,
  FiCalendar,
  FiCheckCircle,
  FiBookmark,
  FiUpload,
  FiSearch,
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
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-200 font-semibold text-xs shadow-sm transition-colors"
            >
              <FiUpload className="text-sm text-blue-600 dark:text-blue-400" />
              <span>Manage Resumes</span>
            </button>

            <Link
              to="/jobs"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs shadow-sm transition-colors"
            >
              <FiSearch className="text-sm" />
              <span>Browse All Jobs</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Applications */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Applications
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mt-1">
                {stats?.applied ?? 0}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl flex-shrink-0">
              <FiBriefcase />
            </div>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/60">
            Total positions applied for
          </p>
        </div>

        {/* Interviews Scheduled */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Interviews
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                {stats?.interviews ?? 0}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl flex-shrink-0">
              <FiCalendar />
            </div>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/60">
            Scheduled & active interviews
          </p>
        </div>

        {/* Job Offers */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Job Offers
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                {stats?.offers ?? 0}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl flex-shrink-0">
              <FiCheckCircle />
            </div>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/60">
            Received candidate offers
          </p>
        </div>

        {/* Saved Jobs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Saved Jobs
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold text-purple-600 dark:text-purple-400 mt-1">
                {stats?.saved ?? 0}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xl flex-shrink-0">
              <FiBookmark />
            </div>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/60">
            Bookmarked for later review
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
