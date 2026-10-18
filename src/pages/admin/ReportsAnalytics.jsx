import React, { useState, useEffect, useCallback } from "react";
import {
  FiBarChart2,
  FiTrendingUp,
  FiUsers,
  FiBriefcase,
  FiFileText,
  FiDownload,
  FiCalendar,
  FiFilter,
  FiChevronDown,
  FiActivity,
  FiPieChart,
  FiClock,
  FiRefreshCw,
  FiAlertCircle,
  FiCheckCircle,
  FiShield,
  FiChevronLeft,
  FiChevronRight,
  FiInfo,
} from "react-icons/fi";
import userApi from "../../services/userApi";
import auditService from "../../services/auditService";

const ReportsAnalytics = () => {
  const [dateRange, setDateRange] = useState("30days");
  const [reportType, setReportType] = useState("overview");

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
    applicationTrend: [],
    jobStats: {
      byStatus: [],
      byApprovalStatus: [],
      byType: [],
      topAppliedJobs: [],
    },
    applicationStats: {
      byStatus: [],
    },
    periodStats: null,
  });

  const [auditLogs, setAuditLogs] = useState([]);
  const [auditPagination, setAuditPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalLogs: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [auditActionFilter, setAuditActionFilter] = useState("all");
  const [auditPage, setAuditPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  const getStartDateFromRange = (range) => {
    if (range === "all") return "";
    const daysMap = { "7days": 7, "30days": 30, "90days": 90, "1year": 365 };
    const days = daysMap[range] || 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return cutoff.toISOString();
  };

  // Load Platform Statistics
  const loadStats = useCallback(async () => {
    try {
      setError(null);
      const res = await userApi.getUserStatistics({ dateRange });
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error("Failed to load platform statistics:", err);
      setError("Unable to load platform analytics. Please check your network or try again.");
    }
  }, [dateRange]);

  // Load Audit Trail
  const loadAuditLogs = useCallback(async () => {
    try {
      const startDate = getStartDateFromRange(dateRange);
      const res = await auditService.getAuditLogs({
        page: auditPage,
        limit: 15,
        action: auditActionFilter,
        startDate: startDate || undefined,
      });
      if (res.success && res.data) {
        setAuditLogs(res.data.logs || []);
        if (res.data.pagination) {
          setAuditPagination(res.data.pagination);
        }
      }
    } catch (err) {
      console.error("Failed to load audit logs:", err);
      setError("Unable to retrieve persistent audit logs.");
    }
  }, [auditPage, auditActionFilter, dateRange]);

  // Initial and reactive load
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      if (reportType === "audit") {
        await loadAuditLogs();
      } else {
        await loadStats();
      }
      setLoading(false);
    };
    fetchData();
  }, [reportType, loadStats, loadAuditLogs]);

  const handleRefresh = async () => {
    setLoading(true);
    if (reportType === "audit") {
      await loadAuditLogs();
    } else {
      await loadStats();
    }
    setLoading(false);
    showFeedback("success", "Analytics data refreshed");
  };

  // CSV Helper for In-Browser Exports
  const downloadCsv = (filename, headers, rows, metadata = []) => {
    const escapeField = (f) => `"${String(f ?? "").replace(/"/g, '""')}"`;
    const lines = [];

    if (metadata.length > 0) {
      metadata.forEach((m) => lines.push(escapeField(m)));
      lines.push(""); // empty separator
    }

    lines.push(headers.map(escapeField).join(","));
    rows.forEach((row) => {
      lines.push(row.map(escapeField).join(","));
    });

    const blob = new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // JSON Helper for In-Browser Exports
  const downloadJson = (filename, data) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export Dispatcher
  const handleExport = async (format = "csv") => {
    setExporting(true);
    const today = new Date().toISOString().split("T")[0];

    try {
      if (reportType === "audit") {
        // Direct backend audit export stream with active filters
        const startDate = getStartDateFromRange(dateRange);
        await auditService.exportLogs({
          action: auditActionFilter,
          startDate: startDate || undefined,
          format: "csv",
        });
        showFeedback("success", "Audit log export downloaded successfully");
        setExporting(false);
        return;
      }

      if (format === "json") {
        const payload = {
          reportType,
          dateRange,
          exportedAt: new Date().toISOString(),
          stats,
        };
        downloadJson(`admin-report-${reportType}-${today}.json`, payload);
        showFeedback("success", `Report exported as JSON`);
        setExporting(false);
        return;
      }

      // Format CSV based on active report
      const meta = [
        `Job Portal Administrative Report: ${reportType.toUpperCase()}`,
        `Date Generated: ${new Date().toLocaleString()}`,
        `Filter Range: ${dateRange}`,
        `Total Database Records — Users: ${stats.totalUsers}, Jobs: ${stats.totalJobs}, Applications: ${stats.totalApplications}`,
      ];

      if (reportType === "overview") {
        const headers = ["Metric", "Value", "Notes"];
        const rows = [
          ["Total Registered Users", stats.totalUsers, "All-time database total"],
          ["Active Users", stats.activeUsers, "Users in 'active' status"],
          ["Inactive Users", stats.inactiveUsers, "Users in 'inactive' status"],
          ["Blocked Users", stats.blockedUsers, "Users in 'blocked' status"],
          ["Total Jobs", stats.totalJobs, "All jobs across all employers"],
          ["Total Applications", stats.totalApplications, "All-time applications"],
          ["Recent Activity (7 Days)", stats.recentActivity, "Applications submitted in the last 7 days"],
        ];

        if (stats.periodStats) {
          rows.push(
            ["New Users in Period", stats.periodStats.newUsers, `Within ${dateRange}`],
            ["New Jobs in Period", stats.periodStats.newJobs, `Within ${dateRange}`],
            ["New Applications in Period", stats.periodStats.newApplications, `Within ${dateRange}`]
          );
        }

        downloadCsv(`admin-report-overview-${today}.csv`, headers, rows, meta);
      } else if (reportType === "jobs") {
        const headers = ["Category", "Key", "Count"];
        const rows = [];

        (stats.jobStats?.byStatus || []).forEach((st) => {
          rows.push(["Listing Status", st.status, st.count]);
        });
        (stats.jobStats?.byApprovalStatus || []).forEach((ap) => {
          rows.push(["Approval Moderation", ap.approvalStatus, ap.count]);
        });
        (stats.jobStats?.byType || []).forEach((tp) => {
          rows.push(["Employment Type", tp.type, tp.count]);
        });
        (stats.jobStats?.topAppliedJobs || []).forEach((job) => {
          rows.push(["Top Applied Job", `${job.title} (${job.company})`, job.applicationCount]);
        });

        downloadCsv(`admin-report-jobs-${today}.csv`, headers, rows, meta);
      } else if (reportType === "users") {
        const headers = ["Dimension", "Role / Status", "Count"];
        const rows = [];

        (stats.roleStats || []).forEach((r) => {
          rows.push(["User Role", r.role, r.count]);
        });
        rows.push(["Account Status", "Active", stats.activeUsers]);
        rows.push(["Account Status", "Inactive", stats.inactiveUsers]);
        rows.push(["Account Status", "Blocked", stats.blockedUsers]);

        (stats.registrationTrend || []).forEach((trend) => {
          rows.push(["Registration History", trend.date, trend.count]);
        });

        downloadCsv(`admin-report-users-${today}.csv`, headers, rows, meta);
      } else if (reportType === "applications") {
        const headers = ["Pipeline Stage", "Applications Count", "Percentage of Total"];
        const rows = (stats.applicationStats?.byStatus || []).map((app) => [
          app.status,
          app.count,
          `${app.percentage}%`,
        ]);

        downloadCsv(`admin-report-applications-${today}.csv`, headers, rows, meta);
      }

      showFeedback("success", `Report exported successfully as CSV`);
    } catch (err) {
      console.error("Export error:", err);
      showFeedback("error", err.message || "Failed to generate report export");
    } finally {
      setExporting(false);
    }
  };

  const getActionBadgeColor = (action = "") => {
    if (action.includes("DELETE") || action.includes("BLOCK")) {
      return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800/40";
    }
    if (action.includes("CREATE") || action.includes("SUBMIT")) {
      return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-800/40";
    }
    if (action.includes("ROLE") || action.includes("STATUS") || action.includes("UPDATE")) {
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800/40";
    }
    return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600";
  };

  // Render Overview Tab
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Platform Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Total Users
              </p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.totalUsers.toLocaleString()}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {stats.activeUsers} active • {stats.inactiveUsers} inactive
              </p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
              <FiUsers className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Total Jobs
              </p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.totalJobs.toLocaleString()}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Across all employer listings
              </p>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-xl text-green-600 dark:text-green-400">
              <FiBriefcase className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Total Applications
              </p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.totalApplications.toLocaleString()}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                All candidates submissions
              </p>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400">
              <FiFileText className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                7-Day Activity
              </p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.recentActivity.toLocaleString()}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Applications in past 7 days
              </p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400">
              <FiActivity className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Period Specific Summary Banner (if filtered) */}
      {stats.periodStats && (
        <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <FiClock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h4 className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">
                Activity in Selected Period ({dateRange})
              </h4>
              <p className="text-xs text-indigo-700 dark:text-indigo-300">
                Database additions recorded within this timeframe
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">New Users:</span>{" "}
              <span className="font-bold text-indigo-900 dark:text-indigo-100">{stats.periodStats.newUsers}</span>
            </div>
            <div>
              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">New Jobs:</span>{" "}
              <span className="font-bold text-indigo-900 dark:text-indigo-100">{stats.periodStats.newJobs}</span>
            </div>
            <div>
              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">New Applications:</span>{" "}
              <span className="font-bold text-indigo-900 dark:text-indigo-100">{stats.periodStats.newApplications}</span>
            </div>
          </div>
        </div>
      )}

      {/* Database Trends Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Registration Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FiUsers className="text-indigo-600 dark:text-indigo-400" />
              User Registrations Over Time
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {stats.registrationTrend.length} days recorded
            </span>
          </div>

          {stats.registrationTrend.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
              No registration activity recorded in this period.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {stats.registrationTrend.slice(-10).map((t, idx) => {
                const max = Math.max(...stats.registrationTrend.map((x) => x.count), 1);
                const pct = Math.min(100, Math.round((t.count / max) * 100));
                return (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="w-24 text-xs font-mono text-gray-600 dark:text-gray-400">{t.date}</span>
                    <div className="flex-1 mx-3 bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div className="bg-indigo-600 dark:bg-indigo-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-12 text-right font-medium text-gray-900 dark:text-white text-xs">
                      {t.count} user{t.count === 1 ? "" : "s"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Application Submission Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FiFileText className="text-purple-600 dark:text-purple-400" />
              Application Volume Over Time
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {stats.applicationTrend.length} days recorded
            </span>
          </div>

          {stats.applicationTrend.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
              No application submissions recorded in this period.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {stats.applicationTrend.slice(-10).map((t, idx) => {
                const max = Math.max(...stats.applicationTrend.map((x) => x.count), 1);
                const pct = Math.min(100, Math.round((t.count / max) * 100));
                return (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="w-24 text-xs font-mono text-gray-600 dark:text-gray-400">{t.date}</span>
                    <div className="flex-1 mx-3 bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div className="bg-purple-600 dark:bg-purple-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-12 text-right font-medium text-gray-900 dark:text-white text-xs">
                      {t.count} app{t.count === 1 ? "" : "s"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Unavailable Metrics Notice */}
      <div className="bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex items-start gap-3">
        <FiInfo className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
          <p className="font-semibold text-gray-800 dark:text-gray-200 mb-0.5">
            Transparent Data Disclosure
          </p>
          Page view impressions, bounce rates, and average time-to-hire are omitted from this dashboard because visitor tracking is not enabled. All counts and percentages reflect verified records directly in the application database.
        </div>
      </div>
    </div>
  );

  // Render Job Analytics Tab
  const renderJobAnalytics = () => (
    <div className="space-y-6">
      {/* Job Distribution Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* By Status */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <FiPieChart className="text-blue-500" />
            Jobs by Listing Status
          </h4>
          <div className="space-y-2">
            {(stats.jobStats?.byStatus || []).map((st, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-gray-100 dark:border-gray-700/60 last:border-0">
                <span className="text-gray-600 dark:text-gray-300 capitalize">{st.status}</span>
                <span className="font-semibold text-gray-900 dark:text-white">{st.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* By Approval Status */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <FiShield className="text-green-500" />
            Jobs by Moderation Status
          </h4>
          <div className="space-y-2">
            {(stats.jobStats?.byApprovalStatus || []).map((ap, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-gray-100 dark:border-gray-700/60 last:border-0">
                <span className="text-gray-600 dark:text-gray-300 capitalize">{ap.approvalStatus}</span>
                <span className="font-semibold text-gray-900 dark:text-white">{ap.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* By Employment Type */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <FiBriefcase className="text-purple-500" />
            Jobs by Employment Type
          </h4>
          <div className="space-y-2">
            {(stats.jobStats?.byType || []).map((tp, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-gray-100 dark:border-gray-700/60 last:border-0">
                <span className="text-gray-600 dark:text-gray-300">{tp.type}</span>
                <span className="font-semibold text-gray-900 dark:text-white">{tp.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top 5 Most Applied Jobs Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <FiTrendingUp className="text-indigo-600 dark:text-indigo-400" />
          Top Applied Job Postings (Database Totals)
        </h3>

        {(!stats.jobStats?.topAppliedJobs || stats.jobStats.topAppliedJobs.length === 0) ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
            No applications have been recorded for any active jobs yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/40">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Job Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Hiring Company
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Applications Received
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {stats.jobStats.topAppliedJobs.map((job, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-6 py-3.5 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {job.title}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {job.company}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-sm text-right font-bold text-indigo-600 dark:text-indigo-400">
                      {job.applicationCount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  // Render User Analytics Tab
  const renderUserAnalytics = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Users by Role */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FiUsers className="text-indigo-600 dark:text-indigo-400" />
            Users by Role
          </h3>
          <div className="space-y-4">
            {(stats.roleStats || []).map((roleItem, idx) => {
              const total = stats.totalUsers || 1;
              const pct = Math.round((roleItem.count / total) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700 dark:text-gray-300 capitalize">
                      {roleItem.role === "jobseeker" ? "Job Seekers" : roleItem.role === "employer" ? "Employers" : "Administrators"}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 text-xs">
                      {roleItem.count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full ${
                        roleItem.role === "admin"
                          ? "bg-indigo-600"
                          : roleItem.role === "employer"
                          ? "bg-purple-600"
                          : "bg-blue-600"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Users by Account Status */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FiShield className="text-green-600 dark:text-green-400" />
            Account Status Distribution
          </h3>
          <div className="space-y-4">
            {[
              { status: "Active", count: stats.activeUsers, color: "bg-green-600" },
              { status: "Inactive", count: stats.inactiveUsers, color: "bg-yellow-500" },
              { status: "Blocked", count: stats.blockedUsers, color: "bg-red-600" },
            ].map((st, idx) => {
              const total = stats.totalUsers || 1;
              const pct = Math.round((st.count / total) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700 dark:text-gray-300">{st.status}</span>
                    <span className="text-gray-500 dark:text-gray-400 text-xs">
                      {st.count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden">
                    <div className={`h-2.5 rounded-full ${st.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  // Render Application Analytics Tab
  const renderApplicationAnalytics = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <FiFileText className="text-purple-600 dark:text-purple-400" />
          Application Pipeline Stages (Complete Dataset)
        </h3>

        {(!stats.applicationStats?.byStatus || stats.applicationStats.byStatus.length === 0) ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
            No applications recorded yet.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {stats.applicationStats.byStatus.map((app, idx) => (
              <div
                key={idx}
                className="p-4 bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700 rounded-xl text-center"
              >
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {app.count.toLocaleString()}
                </div>
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 capitalize mt-1">
                  {app.status.replace("_", " ")}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {app.percentage}% of total
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Render Audit Logs Tab
  const renderAuditLogs = () => (
    <div className="space-y-4">
      {/* Action Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 dark:bg-gray-700/30 p-3.5 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <FiFilter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Action Filter:</span>
          <select
            value={auditActionFilter}
            onChange={(e) => {
              setAuditActionFilter(e.target.value);
              setAuditPage(1);
            }}
            className="text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 py-1 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Actions</option>
            <option value="ROLE_CHANGE">ROLE_CHANGE</option>
            <option value="STATUS_CHANGE">STATUS_CHANGE</option>
            <option value="USER_DELETE">USER_DELETE</option>
            <option value="JOB_CREATE">JOB_CREATE</option>
            <option value="JOB_UPDATE">JOB_UPDATE</option>
            <option value="JOB_DELETE">JOB_DELETE</option>
            <option value="APPLICATION_UPDATE">APPLICATION_UPDATE</option>
          </select>
        </div>

        <span className="text-xs text-gray-500 dark:text-gray-400">
          Showing {auditLogs.length} of {auditPagination.totalLogs} recorded events
        </span>
      </div>

      {/* Audit Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {auditLogs.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400 text-sm">
            No audit records match the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/40">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Performed By
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Target User
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    IP Address
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/20 text-xs">
                    <td className="px-5 py-3.5 whitespace-nowrap text-gray-500 dark:text-gray-400 font-mono">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString() : "Unknown"}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold border ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-gray-900 dark:text-white font-medium">
                      {log.performedByUser?.name || `User #${log.performedBy || "System"}`}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-gray-600 dark:text-gray-300">
                      {log.targetUser?.name || (log.targetUserId ? `User #${log.targetUserId}` : "N/A")}
                    </td>
                    <td className="px-5 py-3.5 text-gray-700 dark:text-gray-300 max-w-xs truncate" title={log.details}>
                      {log.details || "—"}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-gray-500 dark:text-gray-400 font-mono">
                      {log.ipAddress || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Server-Side Pagination */}
        {auditPagination.totalPages > 1 && (
          <div className="px-5 py-3 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs">
            <span className="text-gray-600 dark:text-gray-400">
              Page {auditPagination.currentPage} of {auditPagination.totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                disabled={!auditPagination.hasPrev || loading}
                className="px-2.5 py-1 rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 disabled:opacity-50 text-gray-700 dark:text-gray-300"
              >
                <FiChevronLeft className="w-3.5 h-3.5 inline mr-1" /> Prev
              </button>
              <button
                onClick={() => setAuditPage((p) => p + 1)}
                disabled={!auditPagination.hasNext || loading}
                className="px-2.5 py-1 rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 disabled:opacity-50 text-gray-700 dark:text-gray-300"
              >
                Next <FiChevronRight className="w-3.5 h-3.5 inline ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <FiBarChart2 className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Reports & Analytics
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Genuine database metrics, historical aggregations, and persistent audit trail.
          </p>
        </div>

        {/* Top Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors"
            title="Refresh Data"
            aria-label="Refresh Data"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={() => handleExport("csv")}
            disabled={exporting}
            className="px-3.5 py-2 text-xs font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
          >
            <FiDownload className="w-4 h-4" />
            {exporting ? "Exporting..." : "Export CSV"}
          </button>

          {reportType !== "audit" && (
            <button
              onClick={() => handleExport("json")}
              disabled={exporting}
              className="px-3 py-2 text-xs font-medium rounded-lg text-gray-700 dark:text-gray-200 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              Export JSON
            </button>
          )}
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`p-3.5 rounded-xl border flex items-center gap-2 text-sm ${
            feedback.type === "success"
              ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-800/60 dark:text-green-300"
              : "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-800/60 dark:text-red-300"
          }`}
        >
          {feedback.type === "success" ? (
            <FiCheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
          ) : (
            <FiAlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Navigation Tabs and Date Range Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-700 pb-3">
        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-1">
          {[
            { id: "overview", label: "Overview", icon: FiActivity },
            { id: "jobs", label: "Job Analytics", icon: FiBriefcase },
            { id: "users", label: "User Analytics", icon: FiUsers },
            { id: "applications", label: "Application Analytics", icon: FiFileText },
            { id: "audit", label: "Audit Logs", icon: FiShield },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = reportType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setReportType(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors ${
                  active
                    ? "bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Date Filter (Available across all tabs) */}
        <div className="flex items-center gap-2">
          <FiCalendar className="w-4 h-4 text-gray-400" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 py-1.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="1year">Last 1 Year</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <FiRefreshCw className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading platform reports & analytics...</p>
        </div>
      ) : error ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-800/50 p-8 text-center space-y-3">
          <FiAlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Analytics Unavailable</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            Retry Loading
          </button>
        </div>
      ) : (
        <div>
          {reportType === "overview" && renderOverview()}
          {reportType === "jobs" && renderJobAnalytics()}
          {reportType === "users" && renderUserAnalytics()}
          {reportType === "applications" && renderApplicationAnalytics()}
          {reportType === "audit" && renderAuditLogs()}
        </div>
      )}
    </div>
  );
};

export default ReportsAnalytics;
