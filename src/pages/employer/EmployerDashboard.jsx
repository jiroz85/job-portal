import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FiBriefcase,
  FiUsers,
  FiFileText,
  FiCalendar,
  FiPlus,
  FiActivity,
  FiRefreshCw,
  FiXCircle,
  FiArrowRight,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiTrendingUp,
  FiBarChart2,
  FiMapPin,
  FiMail,
} from "react-icons/fi";
import { jobService } from "../../services/jobService";
import { applicationService } from "../../services/applicationService";
import EmployerNotifications from "../../components/employer/EmployerNotifications";
import EmployerWorkflowDemo from "../../components/employer/EmployerWorkflowDemo";

const EmployerDashboard = () => {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [serverTotalApplications, setServerTotalApplications] = useState(null);
  const [serverTotalJobs, setServerTotalJobs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showWorkflowDemo, setShowWorkflowDemo] = useState(false);

  // Fetch real data from backend
  const loadDashboardData = useCallback(async (isManual = false) => {
    if (isManual) {
      setRefreshing(true);
    }

    try {
      // Both endpoints return { success: true, data: [...], pagination: { total: number } }
      const [jobsResponse, applicationsResponse] = await Promise.all([
        jobService.getMyJobs({ limit: 100 }),
        applicationService.getAllApplications({ limit: 100 }),
      ]);

      const fetchedJobs =
        jobsResponse?.success && Array.isArray(jobsResponse.data)
          ? jobsResponse.data
          : [];
      const fetchedApplications =
        applicationsResponse?.success && Array.isArray(applicationsResponse.data)
          ? applicationsResponse.data
          : [];

      setJobs(fetchedJobs);
      setApplications(fetchedApplications);

      // Extract verified complete employer-scoped database totals from pagination metadata
      if (typeof applicationsResponse?.pagination?.total === "number") {
        setServerTotalApplications(applicationsResponse.pagination.total);
      } else {
        setServerTotalApplications(null);
      }

      if (typeof jobsResponse?.pagination?.total === "number") {
        setServerTotalJobs(jobsResponse.pagination.total);
      } else {
        setServerTotalJobs(null);
      }

      setError(null);
    } catch (err) {
      console.error("Error fetching employer dashboard data:", err);
      setError(
        err.response?.data?.error ||
          err.message ||
          "Failed to load dashboard data. Please verify your connection."
      );
    } finally {
      setLoading(false);
      if (isManual) {
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Asynchronous mount fetch (all setState calls inside loadDashboardData occur after await)
    loadDashboardData(false);

    // Periodic refresh every 30 seconds
    const interval = setInterval(() => {
      if (isMounted) {
        loadDashboardData(false);
      }
    }, 30000);

    // Event listener for candidate application submissions
    const handleApplicationSubmitted = () => {
      if (isMounted) {
        loadDashboardData(false);
      }
    };

    const handleStorageChange = (event) => {
      if (
        event.key === "applicationSubmitted" ||
        event.key === "applicationSubmittedTimestamp"
      ) {
        if (isMounted) {
          loadDashboardData(false);
        }
      }
    };

    window.addEventListener("applicationSubmitted", handleApplicationSubmitted);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener(
        "applicationSubmitted",
        handleApplicationSubmitted
      );
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [loadDashboardData]);

  // ESC key listener to dismiss demo modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && showWorkflowDemo) {
        setShowWorkflowDemo(false);
      }
    };
    if (showWorkflowDemo) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showWorkflowDemo]);

  const handleManualRefresh = () => {
    loadDashboardData(true);
  };

  // Derive genuine metrics from real data
  const metrics = useMemo(() => {
    // Total jobs: prefer validated employer-scoped database total from pagination, fallback to loaded array length
    const totalJobs =
      typeof serverTotalJobs === "number" ? serverTotalJobs : jobs.length;
    const activeJobs = jobs.filter(
      (job) => job.status === "active" || job.status === "Published"
    ).length;
    const draftJobs = jobs.filter(
      (job) => job.status === "Draft" || job.status === "inactive"
    ).length;
    const closedJobs = jobs.filter(
      (job) => job.status === "Closed" || job.status === "filled"
    ).length;

    // Total applications: prefer validated employer-scoped database total from pagination, fallback to loaded array length
    const totalApplications =
      typeof serverTotalApplications === "number"
        ? serverTotalApplications
        : applications.length;
    const isApplicationsTruncated = totalApplications > applications.length;

    const pendingReviews = applications.filter(
      (app) => app.status === "pending" || app.status === "under_review"
    ).length;
    const interviews = applications.filter(
      (app) =>
        app.status === "interview_scheduled" || app.status === "interviewed"
    ).length;
    const shortlisted = applications.filter(
      (app) => app.status === "shortlisted"
    ).length;
    const offersOrHired = applications.filter(
      (app) => app.status === "offered" || app.status === "accepted"
    ).length;

    return {
      totalJobs,
      activeJobs,
      draftJobs,
      closedJobs,
      totalApplications,
      isApplicationsTruncated,
      loadedApplicationsCount: applications.length,
      pendingReviews,
      interviews,
      shortlisted,
      offersOrHired,
    };
  }, [jobs, applications, serverTotalJobs, serverTotalApplications]);

  // Derive recent applicants (most recent applications first)
  const recentApplicants = useMemo(() => {
    return [...applications]
      .sort(
        (a, b) =>
          new Date(b.applicationDate || b.createdAt || 0) -
          new Date(a.applicationDate || a.createdAt || 0)
      )
      .slice(0, 5);
  }, [applications]);

  // Derive recent jobs with genuine application counts
  const recentJobsWithCounts = useMemo(() => {
    return [...jobs]
      .sort(
        (a, b) =>
          new Date(b.createdAt || b.postedDate || 0) -
          new Date(a.createdAt || a.postedDate || 0)
      )
      .slice(0, 5)
      .map((job) => {
        const jobApps = applications.filter((app) => app.jobId === job.id);
        const pendingForJob = jobApps.filter(
          (app) => app.status === "pending" || app.status === "under_review"
        ).length;
        return {
          ...job,
          applicationsCount: jobApps.length,
          pendingCount: pendingForJob,
        };
      });
  }, [jobs, applications]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return {
          label: "Pending",
          className:
            "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
        };
      case "under_review":
        return {
          label: "Under Review",
          className:
            "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
        };
      case "shortlisted":
        return {
          label: "Shortlisted",
          className:
            "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800",
        };
      case "interview_scheduled":
        return {
          label: "Interview Scheduled",
          className:
            "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800",
        };
      case "interviewed":
        return {
          label: "Interviewed",
          className:
            "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-400 dark:border-cyan-800",
        };
      case "offered":
        return {
          label: "Offered",
          className:
            "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
        };
      case "accepted":
        return {
          label: "Accepted / Hired",
          className:
            "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-800",
        };
      case "rejected":
        return {
          label: "Rejected",
          className:
            "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800",
        };
      case "withdrawn":
        return {
          label: "Withdrawn",
          className:
            "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
        };
      default:
        return {
          label: status || "Applied",
          className:
            "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
        };
    }
  };

  const getJobStatusBadge = (status) => {
    switch (status) {
      case "active":
      case "Published":
        return {
          label: "Active",
          className:
            "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
        };
      case "Draft":
        return {
          label: "Draft",
          className:
            "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
        };
      case "Closed":
      case "filled":
        return {
          label: "Closed",
          className:
            "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700",
        };
      default:
        return {
          label: status || "Open",
          className:
            "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
        };
    }
  };

  const getInitials = (name) => {
    if (!name || typeof name !== "string") return "CA";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const quickActions = [
    {
      title: "Post New Job",
      description: "Create and publish a vacancy",
      icon: FiPlus,
      color: "bg-blue-600 text-white",
      href: "/employer/post-job",
    },
    {
      title: "Manage Jobs",
      description: "View all postings and statuses",
      icon: FiBriefcase,
      color: "bg-indigo-600 text-white",
      href: "/employer/jobs",
    },
    {
      title: "Applicant Tracking",
      description: "Screen, shortlist, and review",
      icon: FiUsers,
      color: "bg-emerald-600 text-white",
      href: "/employer/applicants",
    },
    {
      title: "Interview Schedule",
      description: "Manage candidate interviews",
      icon: FiCalendar,
      color: "bg-purple-600 text-white",
      href: "/employer/interviews",
    },
    {
      title: "Employer Analytics",
      description: "Hiring funnel and metrics",
      icon: FiBarChart2,
      color: "bg-cyan-600 text-white",
      href: "/employer/analytics",
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Employer Dashboard
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            Real-time overview of active vacancies, applicant pipeline, and recruitment metrics.
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-auto">
          <EmployerNotifications />
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={refreshing || loading}
            className="inline-flex items-center space-x-2 px-3.5 py-2 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-xs disabled:opacity-50"
          >
            <FiRefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin text-blue-600" : "text-gray-500"}`}
            />
            <span>{refreshing ? "Updating..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Error Alert with Retry */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3 text-red-700 dark:text-red-300">
            <FiAlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => loadDashboardData(true)}
            className="inline-flex items-center justify-center px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors shrink-0"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Statistics Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 animate-pulse space-y-3"
            >
              <div className="h-10 w-10 bg-gray-200 dark:bg-gray-800 rounded-xl" />
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
              <div className="h-8 w-16 bg-gray-200 dark:bg-gray-800 rounded" />
              <div className="h-3 w-32 bg-gray-200 dark:bg-gray-800 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Active Jobs Card */}
          <Link
            to="/employer/jobs"
            className="group p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <FiBriefcase className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300">
                {metrics.totalJobs} total
              </span>
            </div>
            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Active Jobs
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {metrics.activeJobs}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center">
                <span>{metrics.draftJobs} draft / {metrics.closedJobs} closed</span>
              </p>
            </div>
          </Link>

          {/* Total Applicants Card */}
          <Link
            to="/employer/applicants"
            className="group p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-emerald-500 dark:hover:border-emerald-500 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <FiUsers className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                All-time
              </span>
            </div>
            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Total Applicants
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {metrics.totalApplications}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {metrics.isApplicationsTruncated ? (
                  <span>
                    {metrics.shortlisted} shortlisted / {metrics.offersOrHired} hired (from latest {metrics.loadedApplicationsCount})
                  </span>
                ) : (
                  <span>{metrics.shortlisted} shortlisted / {metrics.offersOrHired} hired</span>
                )}
              </p>
            </div>
          </Link>

          {/* Pending Reviews Card */}
          <Link
            to="/employer/applicants"
            className="group p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-amber-500 dark:hover:border-amber-500 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <FiClock className="w-6 h-6" />
              </div>
              {metrics.pendingReviews > 0 ? (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 animate-pulse">
                  Action needed
                </span>
              ) : (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                  Caught up
                </span>
              )}
            </div>
            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Pending Reviews
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {metrics.pendingReviews}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Awaiting initial candidate screening
              </p>
            </div>
          </Link>

          {/* Interviews Scheduled Card */}
          <Link
            to="/employer/interviews"
            className="group p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-purple-500 dark:hover:border-purple-500 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200/60 dark:border-purple-800/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <FiCalendar className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300">
                Pipeline
              </span>
            </div>
            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Interviews Active
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {metrics.interviews}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Scheduled or completed rounds
              </p>
            </div>
          </Link>
        </div>
      )}

      {/* Two Column Layout: Recent Applicants (2/3) + Recent Jobs (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Applicants Section */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Recent Applicants
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {metrics.isApplicationsTruncated
                  ? `Showing latest ${metrics.loadedApplicationsCount} of ${metrics.totalApplications} candidate submissions`
                  : "Latest submissions across all your posted positions"}
              </p>
            </div>
            <Link
              to="/employer/applicants"
              className="inline-flex items-center space-x-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <span>View All</span>
              <FiArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-6 flex-1 flex flex-col">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 animate-pulse flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800" />
                      <div className="space-y-2">
                        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded" />
                        <div className="h-3 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
                      </div>
                    </div>
                    <div className="h-6 w-20 bg-gray-200 dark:bg-gray-800 rounded-full" />
                  </div>
                ))}
              </div>
            ) : recentApplicants.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12 px-4">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500 mb-3">
                  <FiUsers className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  No applicants received yet
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
                  {jobs.length === 0
                    ? "Post your first job vacancy to start receiving qualified candidate applications."
                    : "Your active job postings are live. Once candidates apply, their profiles will appear here."}
                </p>
                {jobs.length === 0 && (
                  <Link
                    to="/employer/post-job"
                    className="mt-4 inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                  >
                    <FiPlus className="w-3.5 h-3.5" />
                    <span>Create First Job</span>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {recentApplicants.map((application) => {
                  const statusInfo = getStatusBadge(application.status);
                  const appliedDate = application.applicationDate || application.createdAt;
                  const formattedDate = appliedDate
                    ? new Date(appliedDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Recently";

                  return (
                    <div
                      key={application.id}
                      className="p-4 rounded-xl border border-gray-200/80 dark:border-gray-800/80 hover:border-gray-300 dark:hover:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center space-x-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-semibold text-xs shrink-0 shadow-xs">
                          {getInitials(application.applicantName)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {application.applicantName || "Anonymous Candidate"}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-300 font-medium truncate">
                            {application.job?.title || "Role #" + application.jobId}
                          </p>
                          <div className="flex items-center space-x-2 text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                            <span className="flex items-center space-x-1 truncate max-w-[150px]">
                              <FiMail className="w-3 h-3 shrink-0" />
                              <span className="truncate">{application.applicantEmail}</span>
                            </span>
                            <span>•</span>
                            <span>Applied {formattedDate}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end space-x-3 shrink-0">
                        <span
                          className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${statusInfo.className}`}
                        >
                          {statusInfo.label}
                        </span>

                        <Link
                          to={`/employer/jobs/${application.jobId}/applicants`}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          Review
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Job Listings & Real Application Counts */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Active Postings
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Real application volume by position
              </p>
            </div>
            <Link
              to="/employer/jobs"
              className="inline-flex items-center space-x-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <span>Manage</span>
              <FiArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-6 flex-1 flex flex-col">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 animate-pulse space-y-2"
                  >
                    <div className="h-4 w-28 bg-gray-200 dark:bg-gray-800 rounded" />
                    <div className="h-3 w-16 bg-gray-200 dark:bg-gray-800 rounded" />
                  </div>
                ))}
              </div>
            ) : recentJobsWithCounts.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12 px-4">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500 mb-3">
                  <FiBriefcase className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  No job postings yet
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
                  Create a position to start receiving genuine candidate applications.
                </p>
                <Link
                  to="/employer/post-job"
                  className="mt-4 inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                >
                  <FiPlus className="w-3.5 h-3.5" />
                  <span>Post Job</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-3.5">
                {recentJobsWithCounts.map((job) => {
                  const jobStatus = getJobStatusBadge(job.status);
                  return (
                    <div
                      key={job.id}
                      className="p-3.5 rounded-xl border border-gray-200/80 dark:border-gray-800/80 bg-gray-50/50 dark:bg-gray-800/30 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <Link
                          to={`/employer/jobs/${job.id}/applicants`}
                          className="text-sm font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate block"
                        >
                          {job.title}
                        </Link>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${jobStatus.className}`}
                        >
                          {jobStatus.label}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-1 border-t border-gray-200/50 dark:border-gray-700/50">
                        <span className="flex items-center space-x-1">
                          <FiUsers className="w-3.5 h-3.5 text-blue-500" />
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {job.applicationsCount}
                          </span>
                          <span>applications</span>
                        </span>

                        {job.pendingCount > 0 ? (
                          <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                            {job.pendingCount} pending
                          </span>
                        ) : (
                          <span className="text-[11px] text-gray-400 dark:text-gray-500">
                            0 pending
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions & Demo Modal trigger */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Recruitment Quick Actions
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Direct access to essential hiring workflows and pipeline tools
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowWorkflowDemo(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 hover:bg-pink-100 dark:hover:bg-pink-950/70 border border-pink-200 dark:border-pink-900/60 transition-colors"
          >
            <FiActivity className="w-3.5 h-3.5" />
            <span>Workflow Demo</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.href}
              className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-all flex flex-col justify-between group"
            >
              <div className="flex items-center space-x-3 mb-2">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${action.color}`}
                >
                  <action.icon className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                  {action.title}
                </h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {action.description}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Step-by-Step Workflow Demo Modal */}
      {showWorkflowDemo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-800 shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Step-by-Step Hiring Workflow
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Visual guide to the candidate progression pipeline
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWorkflowDemo(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Close modal"
                >
                  <FiXCircle className="w-6 h-6" />
                </button>
              </div>
              <EmployerWorkflowDemo />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployerDashboard;
