import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import DashboardStats from "../../components/admin/DashboardStats";
import { API_URL } from "../../utils/apiConfig";
import auditService from "../../services/auditService";
import {
  FiRefreshCw,
  FiActivity,
  FiUser,
  FiCalendar,
  FiShield,
  FiAlertCircle,
  FiCheckCircle,
  FiArrowRight,
  FiClock,
} from "react-icons/fi";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalJobs: 0,
    totalApplications: 0,
    recentActivity: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    blockedUsers: 0,
    roleStats: [],
    recentUsers: [],
    registrationTrend: [],
  });
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const [statsRes, auditRes] = await Promise.allSettled([
        fetch(`${API_URL}/users/statistics`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        auditService.getAuditLogs({ limit: 10 }),
      ]);

      if (statsRes.status === "fulfilled" && statsRes.value.ok) {
        const statsData = await statsRes.value.json();
        if (statsData.success && statsData.data) {
          setStats(statsData.data);
        }
      } else if (statsRes.status === "rejected" || (statsRes.value && !statsRes.value.ok)) {
        console.warn("Failed to retrieve user statistics from server");
      }

      if (auditRes.status === "fulfilled" && auditRes.value?.success) {
        setAuditLogs(auditRes.value.data?.logs || []);
      } else {
        console.warn("Failed to retrieve audit trail from server");
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError("Unable to load platform data. Please check your network connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const getActionBadgeColor = (action = "") => {
    if (action.includes("DELETE") || action.includes("BLOCK")) {
      return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800/40";
    }
    if (action.includes("CREATE") || action.includes("REGISTER") || action.includes("SUBMIT")) {
      return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-800/40";
    }
    if (action.includes("ROLE") || action.includes("STATUS") || action.includes("UPDATE")) {
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800/40";
    }
    return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600";
  };

  const getRoleBadgeColor = (role = "") => {
    switch (role.toLowerCase()) {
      case "admin":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300";
      case "employer":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300";
      case "jobseeker":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Administrator Dashboard
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Real-time platform metrics and database-backed audit log
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="inline-flex items-center px-3.5 py-2 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-xs transition-colors disabled:opacity-60"
            title="Refresh statistics and audit records"
          >
            <FiRefreshCw
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin text-indigo-600 dark:text-indigo-400" : ""}`}
            />
            {loading ? "Refreshing..." : "Refresh Data"}
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FiAlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          </div>
          <button
            onClick={fetchDashboardData}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Verified Dashboard Metric Tiles */}
      <DashboardStats stats={stats} loading={loading} />

      {/* Two Column Grid: Historical Audit Feed + Recent Registrations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Left Column: Historical Audit Trail (2 Cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 shadow-xs rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FiActivity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Historical Audit Trail
              </h2>
            </div>
            <Link
              to="/admin/reports"
              className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 inline-flex items-center"
            >
              Full Audit Trail
              <FiArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <div className="p-6 flex-1">
            {loading && auditLogs.length === 0 ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg animate-pulse h-16"
                  ></div>
                ))}
              </div>
            ) : auditLogs.length > 0 ? (
              <div className="space-y-3">
                {auditLogs.map((log) => {
                  const performedBy =
                    log.performedByUser?.name ||
                    log.performedByUser?.email ||
                    (log.performedBy ? `User #${log.performedBy}` : "System / Automated");
                  const targetUser =
                    log.targetUser?.name ||
                    log.targetUser?.email ||
                    (log.targetUserId ? `User #${log.targetUserId}` : null);

                  return (
                    <div
                      key={log.id}
                      className="p-3.5 bg-gray-50/80 dark:bg-gray-700/30 rounded-lg border border-gray-100 dark:border-gray-700/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-colors hover:bg-gray-100/70 dark:hover:bg-gray-700/50"
                    >
                      <div className="flex items-start space-x-3">
                        <span
                          className={`mt-0.5 px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded border ${getActionBadgeColor(
                            log.action
                          )}`}
                        >
                          {log.action?.replace(/_/g, " ") || "AUDIT"}
                        </span>
                        <div>
                          <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                            {log.details || log.action?.replace(/_/g, " ")}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                            <span>By: <strong className="font-medium text-gray-700 dark:text-gray-300">{performedBy}</strong></span>
                            {targetUser && (
                              <span>• Target: <strong className="font-medium text-gray-700 dark:text-gray-300">{targetUser}</strong></span>
                            )}
                            {log.ipAddress && (
                              <span className="hidden md:inline">• IP: {log.ipAddress}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center text-[11px] text-gray-500 dark:text-gray-400 sm:text-right flex-shrink-0">
                        <FiClock className="w-3 h-3 mr-1 text-gray-400" />
                        {new Date(log.createdAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <FiCheckCircle className="mx-auto h-10 w-10 text-gray-400 dark:text-gray-500 mb-2" />
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  No audit logs recorded yet
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                  Administrative changes and status operations are automatically logged to the audit table and will appear here.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Registered Accounts (1 Col) */}
        <div className="bg-white dark:bg-gray-800 shadow-xs rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FiUser className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Recent Registrations
              </h2>
            </div>
            <Link
              to="/admin/users"
              className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 inline-flex items-center"
            >
              All Users
              <FiArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <div className="p-6 flex-1">
            {loading && (!stats.recentUsers || stats.recentUsers.length === 0) ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg animate-pulse h-14"
                  ></div>
                ))}
              </div>
            ) : stats.recentUsers && stats.recentUsers.length > 0 ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {stats.recentUsers.map((u) => {
                  const initials = u.name
                    ? u.name
                        .trim()
                        .split(/\s+/)
                        .map((p) => p[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()
                    : "U";

                  return (
                    <div
                      key={u.id}
                      className="py-3 flex items-center justify-between first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-semibold text-xs flex items-center justify-center flex-shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                            {u.name || "Unnamed User"}
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                            {u.email}
                          </p>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0 ml-2">
                        <span
                          className={`inline-block px-1.5 py-0.5 text-[10px] font-semibold rounded uppercase ${getRoleBadgeColor(
                            u.role
                          )}`}
                        >
                          {u.role || "user"}
                        </span>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                          {new Date(u.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10">
                <FiUser className="mx-auto h-8 w-8 text-gray-400 dark:text-gray-500 mb-2" />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  No recent registrations found
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
