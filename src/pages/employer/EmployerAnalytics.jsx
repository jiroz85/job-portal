import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FiBriefcase,
  FiUsers,
  FiTrendingUp,
  FiPieChart,
  FiBarChart2,
  FiRefreshCw,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiLayers,
  FiArrowRight,
  FiInfo,
} from "react-icons/fi";
import { jobService } from "../../services/jobService";
import { applicationService } from "../../services/applicationService";

const EmployerAnalytics = () => {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [serverTotalApplications, setServerTotalApplications] = useState(null);
  const [serverTotalJobs, setServerTotalJobs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Load real jobs and applications
  const fetchAnalyticsData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      setError(null);
      const [jobsRes, appsRes] = await Promise.all([
        jobService.getMyJobs({ limit: 100 }),
        applicationService.getAllApplications({ limit: 100 }),
      ]);

      const fetchedJobs =
        jobsRes?.success && Array.isArray(jobsRes.data) ? jobsRes.data : [];
      const fetchedApps =
        appsRes?.success && Array.isArray(appsRes.data) ? appsRes.data : [];

      setJobs(fetchedJobs);
      setApplications(fetchedApps);

      // Extract verified complete employer-scoped database totals from pagination metadata
      if (typeof appsRes?.pagination?.total === "number") {
        setServerTotalApplications(appsRes.pagination.total);
      } else {
        setServerTotalApplications(null);
      }

      if (typeof jobsRes?.pagination?.total === "number") {
        setServerTotalJobs(jobsRes.pagination.total);
      } else {
        setServerTotalJobs(null);
      }
    } catch (err) {
      console.error("Failed to load analytics data:", err);
      setError(
        err.response?.data?.error ||
          err.message ||
          "Failed to load analytics data. Please check your network connection."
      );
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalyticsData(false);
  }, [fetchAnalyticsData]);

  // Derived metrics
  const totalJobs =
    typeof serverTotalJobs === "number" ? serverTotalJobs : jobs.length;
  const activeJobs = useMemo(
    () =>
      jobs.filter(
        (job) => job.status === "active" || job.status === "Published"
      ).length,
    [jobs]
  );
  const draftJobs = useMemo(
    () =>
      jobs.filter(
        (job) => job.status === "Draft" || job.status === "inactive"
      ).length,
    [jobs]
  );
  const closedJobs = useMemo(
    () => jobs.filter((job) => job.status === "Closed").length,
    [jobs]
  );

  const totalApplications =
    typeof serverTotalApplications === "number"
      ? serverTotalApplications
      : applications.length;
  const isApplicationsTruncated = totalApplications > applications.length;

  const avgApplicantsPerActiveJob = useMemo(() => {
    if (activeJobs === 0) return 0;
    return (totalApplications / activeJobs).toFixed(1);
  }, [totalApplications, activeJobs]);

  // Pipeline breakdown based on valid backend statuses
  const pipelineBreakdown = useMemo(() => {
    const counts = {
      pending: 0,
      under_review: 0,
      shortlisted: 0,
      interview: 0,
      hired: 0,
      rejected: 0,
    };

    applications.forEach((app) => {
      const s = app.status;
      if (s === "pending") counts.pending += 1;
      else if (s === "under_review") counts.under_review += 1;
      else if (s === "shortlisted") counts.shortlisted += 1;
      else if (s === "interview_scheduled" || s === "interviewed")
        counts.interview += 1;
      else if (s === "offered" || s === "accepted") counts.hired += 1;
      else if (s === "rejected" || s === "withdrawn") counts.rejected += 1;
    });

    return [
      {
        label: "Pending Review",
        count: counts.pending,
        color: "bg-blue-500",
        textColor: "text-blue-600 dark:text-blue-400",
      },
      {
        label: "Under Review",
        count: counts.under_review,
        color: "bg-amber-500",
        textColor: "text-amber-600 dark:text-amber-400",
      },
      {
        label: "Shortlisted",
        count: counts.shortlisted,
        color: "bg-purple-500",
        textColor: "text-purple-600 dark:text-purple-400",
      },
      {
        label: "Interview Stage",
        count: counts.interview,
        color: "bg-indigo-500",
        textColor: "text-indigo-600 dark:text-indigo-400",
      },
      {
        label: "Offers / Hired",
        count: counts.hired,
        color: "bg-emerald-500",
        textColor: "text-emerald-600 dark:text-emerald-400",
      },
      {
        label: "Archived / Rejected",
        count: counts.rejected,
        color: "bg-gray-400",
        textColor: "text-gray-500 dark:text-gray-400",
      },
    ];
  }, [applications]);

  // Real applications per job leaderboard
  const jobApplicationCounts = useMemo(() => {
    const countsMap = {};
    applications.forEach((app) => {
      const jobId = String(app.jobId || app.job?.id);
      if (jobId) {
        countsMap[jobId] = (countsMap[jobId] || 0) + 1;
      }
    });

    return jobs
      .map((job) => ({
        ...job,
        applicationCount: countsMap[String(job.id)] || 0,
      }))
      .sort((a, b) => b.applicationCount - a.applicationCount);
  }, [jobs, applications]);

  // Job type distribution
  const jobTypeDistribution = useMemo(() => {
    const types = {};
    jobs.forEach((job) => {
      const type = job.type || "Full-time";
      types[type] = (types[type] || 0) + 1;
    });
    return Object.entries(types).map(([name, count]) => ({
      name,
      count,
      percentage:
        totalJobs > 0 ? Math.round((count / totalJobs) * 100) : 0,
    }));
  }, [jobs, totalJobs]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Employer Analytics
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Genuine metrics computed directly from your published postings and applicant records
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchAnalyticsData(true)}
          disabled={refreshing || loading}
          className="inline-flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-xs self-start sm:self-auto disabled:opacity-50"
        >
          <FiRefreshCw
            className={`w-3.5 h-3.5 ${
              refreshing ? "animate-spin text-blue-600" : "text-gray-500"
            }`}
          />
          <span>{refreshing ? "Refreshing..." : "Refresh Metrics"}</span>
        </button>
      </div>

      {/* Database Verification Callout */}
      <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 flex items-start space-x-3 text-xs sm:text-sm text-blue-800 dark:text-blue-300">
        <FiInfo className="w-5 h-5 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
        <p>
          <strong className="font-semibold">Honest Metrics Guarantee:</strong>{" "}
          All figures shown below are aggregated in real time from database records.
          Page views and web cookies are not simulated to avoid misleading recruitment insights.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3 text-red-700 dark:text-red-300">
            <FiAlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => fetchAnalyticsData(true)}
            className="inline-flex items-center justify-center px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors shrink-0"
          >
            Try Again
          </button>
        </div>
      )}

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 animate-pulse space-y-3"
            >
              <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-800" />
              <div className="h-4 w-28 bg-gray-200 dark:bg-gray-800 rounded" />
              <div className="h-7 w-16 bg-gray-200 dark:bg-gray-800 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <FiBriefcase className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300">
                {activeJobs} Active
              </span>
            </div>
            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Total Job Postings
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {totalJobs}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {draftJobs} draft / {closedJobs} closed
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <FiUsers className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                Applications
              </span>
            </div>
            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Total Submissions
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {totalApplications}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {isApplicationsTruncated
                  ? `Across all posted listings (${applications.length} loaded)`
                  : "Across all posted listings"}
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200/60 dark:border-purple-800/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <FiTrendingUp className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300">
                Ratio
              </span>
            </div>
            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Avg per Active Job
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {avgApplicantsPerActiveJob}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Applicants / active opening
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <FiLayers className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300">
                Stages
              </span>
            </div>
            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Active Funnel Stages
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {pipelineBreakdown.filter((p) => p.count > 0).length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Populated workflow stages
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pipeline Funnel Breakdown */}
      <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Application Pipeline Funnel
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {isApplicationsTruncated
                ? `Status distribution across latest ${applications.length} candidate submissions (${totalApplications} total in database)`
                : "Live status distribution of all candidate submissions"}
            </p>
          </div>
          <Link
            to="/employer/applicants"
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
          >
            <span>Track Applicants</span>
            <FiArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {totalApplications === 0 ? (
          <p className="text-xs text-gray-500 dark:text-gray-400 py-4 text-center">
            No candidate submissions recorded yet. Post active jobs to start building your talent pipeline.
          </p>
        ) : (
          <div className="space-y-3 pt-2">
            {pipelineBreakdown.map((item, idx) => {
              const sampleCount = applications.length;
              const pct =
                sampleCount > 0
                  ? Math.round((item.count / sampleCount) * 100)
                  : 0;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {item.label}
                    </span>
                    <span className={`font-bold ${item.textColor}`}>
                      {item.count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Grid: Job Application Leaderboard & Job Type Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leaderboard: 2 cols */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Applications by Job Posting
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {isApplicationsTruncated
                  ? `Positions ordered by volume (from latest ${applications.length} applications)`
                  : "Positions ordered by candidate application volume"}
              </p>
            </div>
            <Link
              to="/employer/jobs"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Manage Jobs →
            </Link>
          </div>

          {jobApplicationCounts.length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-gray-400 py-6 text-center">
              No jobs posted yet. Create your first opening from the Post Job tab.
            </p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {jobApplicationCounts.map((job) => (
                <div
                  key={job.id}
                  className="py-3.5 flex items-center justify-between gap-4"
                >
                  <div className="space-y-0.5 min-w-0">
                    <Link
                      to={`/employer/jobs/${job.id}/applicants`}
                      className="text-sm font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 truncate block transition-colors"
                    >
                      {job.title}
                    </Link>
                    <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>{job.location || "Remote"}</span>
                      <span>•</span>
                      <span>{job.type || "Full-time"}</span>
                      <span>•</span>
                      <span
                        className={`font-medium ${
                          job.status === "active" || job.status === "Published"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-gray-500"
                        }`}
                      >
                        {job.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="px-3 py-1 rounded-xl bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-900 dark:text-white">
                      {job.applicationCount} applicant{job.applicationCount !== 1 ? "s" : ""}
                    </span>
                    <Link
                      to={`/employer/jobs/${job.id}/applicants`}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      title="View applicants"
                    >
                      <FiArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Job Type Breakdown: 1 col */}
        <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Job Type Breakdown
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Distribution across employment classifications
            </p>
          </div>

          {jobTypeDistribution.length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-gray-400 py-6 text-center">
              No job types to display.
            </p>
          ) : (
            <div className="space-y-4 pt-2">
              {jobTypeDistribution.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      {item.name}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {item.count} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-600 dark:bg-blue-500 transition-all duration-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployerAnalytics;
