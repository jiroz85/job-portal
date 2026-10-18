import React from "react";
import {
  FiBriefcase,
  FiUsers,
  FiFileText,
  FiActivity,
  FiUserCheck,
  FiShield,
  FiAlertCircle,
} from "react-icons/fi";

const DashboardStats = ({ stats, loading = false }) => {
  const totalJobs = stats?.totalJobs ?? 0;
  const totalUsers = stats?.totalUsers ?? 0;
  const totalApplications = stats?.totalApplications ?? 0;
  const recentActivity = stats?.recentActivity ?? 0;
  const activeUsers = stats?.activeUsers ?? 0;
  const blockedUsers = stats?.blockedUsers ?? 0;
  const inactiveUsers = stats?.inactiveUsers ?? 0;

  const jobSeekersCount =
    stats?.roleStats?.find((r) => r.role === "jobseeker")?.count ?? 0;
  const employersCount =
    stats?.roleStats?.find((r) => r.role === "employer")?.count ?? 0;
  const adminsCount =
    stats?.roleStats?.find((r) => r.role === "admin")?.count ?? 0;

  const statsData = [
    {
      id: 1,
      name: "Total Jobs",
      value: totalJobs.toLocaleString(),
      icon: FiBriefcase,
      badgeText: "Platform Listings",
      badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
      description: "Active, draft & closed jobs in database",
    },
    {
      id: 2,
      name: "Total Users",
      value: totalUsers.toLocaleString(),
      icon: FiUsers,
      badgeText: `${activeUsers.toLocaleString()} active`,
      badgeColor: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
      description: `${jobSeekersCount.toLocaleString()} seekers, ${employersCount.toLocaleString()} employers`,
    },
    {
      id: 3,
      name: "Total Applications",
      value: totalApplications.toLocaleString(),
      icon: FiFileText,
      badgeText: "Submissions",
      badgeColor: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
      description: "Candidate submissions across all postings",
    },
    {
      id: 4,
      name: "Applications (Last 7 Days)",
      value: recentActivity.toLocaleString(),
      icon: FiActivity,
      badgeText: "Last 7 Days",
      badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
      description: "Applications created in past 7 days",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 mt-6 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 animate-pulse"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5 mt-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat) => (
          <div
            key={stat.id}
            className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                <stat.icon className="w-6 h-6" aria-hidden="true" />
              </div>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${stat.badgeColor}`}
              >
                {stat.badgeText}
              </span>
            </div>

            <div className="mt-4">
              <dt className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {stat.name}
              </dt>
              <dd className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stat.value}
              </dd>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {stat.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Verified Role & Account Distribution Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 flex items-center">
              <FiShield className="mr-1.5 text-indigo-500" />
              Role Distribution
            </h3>
            <span className="text-[11px] text-gray-400 dark:text-gray-500">Database count</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-md bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
              <p className="text-xs text-gray-500 dark:text-gray-400">Job Seekers</p>
              <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                {jobSeekersCount.toLocaleString()}
              </p>
            </div>
            <div className="p-2 rounded-md bg-purple-50/70 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40">
              <p className="text-xs text-gray-500 dark:text-gray-400">Employers</p>
              <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
                {employersCount.toLocaleString()}
              </p>
            </div>
            <div className="p-2 rounded-md bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40">
              <p className="text-xs text-gray-500 dark:text-gray-400">Admins</p>
              <p className="text-lg font-bold text-indigo-700 dark:text-indigo-300">
                {adminsCount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 flex items-center">
              <FiUserCheck className="mr-1.5 text-green-500" />
              Account Status Breakdown
            </h3>
            <span className="text-[11px] text-gray-400 dark:text-gray-500">Account health</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-md bg-green-50/70 dark:bg-green-950/30 border border-green-100 dark:border-green-900/40">
              <p className="text-xs text-gray-500 dark:text-gray-400">Active</p>
              <p className="text-lg font-bold text-green-700 dark:text-green-300">
                {activeUsers.toLocaleString()}
              </p>
            </div>
            <div className="p-2 rounded-md bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600">
              <p className="text-xs text-gray-500 dark:text-gray-400">Inactive</p>
              <p className="text-lg font-bold text-gray-700 dark:text-gray-300">
                {inactiveUsers.toLocaleString()}
              </p>
            </div>
            <div className="p-2 rounded-md bg-red-50/70 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40">
              <p className="text-xs text-gray-500 dark:text-gray-400">Blocked</p>
              <p className="text-lg font-bold text-red-700 dark:text-red-300">
                {blockedUsers.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;
