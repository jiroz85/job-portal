import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FiBriefcase,
  FiMapPin,
  FiCalendar,
  FiEdit2,
  FiTrash2,
  FiUsers,
  FiFilter,
  FiSearch,
  FiPlus,
  FiMoreVertical,
  FiRefreshCw,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiDollarSign,
  FiEye,
} from "react-icons/fi";
import { jobService } from "../../services/jobService";
import { applicationService } from "../../services/applicationService";

const VALID_STATUSES = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "Published", label: "Published" },
  { value: "Draft", label: "Draft" },
  { value: "Closed", label: "Closed" },
];

const JOB_TYPES = [
  "all",
  "Full-time",
  "Part-time",
  "Contract",
  "Internship",
  "Temporary",
];

const ManageJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Interactive controls
  const [actionMenuJobId, setActionMenuJobId] = useState(null);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  // Close dropdown menu on outside click and handle Escape key
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest(".action-menu-container")) {
        setActionMenuJobId(null);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setActionMenuJobId(null);
        if (!isDeleting) {
          setJobToDelete(null);
        }
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDeleting]);

  // Fetch real jobs and applications from backend
  const fetchEmployerData = useCallback(async (isManual = false) => {
    if (isManual) {
      setRefreshing(true);
    }
    try {
      const [jobsResponse, appsResponse] = await Promise.all([
        jobService.getMyJobs({ limit: 100 }),
        applicationService.getAllApplications({ limit: 100 }),
      ]);

      const fetchedJobs =
        jobsResponse?.success && Array.isArray(jobsResponse.data)
          ? jobsResponse.data
          : [];
      const fetchedApps =
        appsResponse?.success && Array.isArray(appsResponse.data)
          ? appsResponse.data
          : [];

      setJobs(fetchedJobs);
      setApplications(fetchedApps);
      setError(null);
    } catch (err) {
      console.error("Error loading employer jobs:", err);
      setError(
        err.response?.data?.error ||
          err.message ||
          "Failed to load job listings. Please check your network connection."
      );
    } finally {
      setLoading(false);
      if (isManual) {
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchEmployerData(false);
  }, [fetchEmployerData]);

  // Temporary flash notification
  const showToast = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  // Map application counts to jobs
  const jobsWithMetrics = useMemo(() => {
    return jobs.map((job) => {
      const jobApps = applications.filter((app) => app.jobId === job.id);
      const pendingCount = jobApps.filter(
        (app) => app.status === "pending" || app.status === "under_review"
      ).length;
      return {
        ...job,
        applicationsCount: jobApps.length,
        pendingCount,
      };
    });
  }, [jobs, applications]);

  // Filtering
  const filteredJobs = useMemo(() => {
    return jobsWithMetrics.filter((job) => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        job.title?.toLowerCase().includes(term) ||
        job.company?.toLowerCase().includes(term) ||
        job.location?.toLowerCase().includes(term) ||
        (job.skills && job.skills.toLowerCase().includes(term));

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active"
          ? job.status === "active" || job.status === "Published"
          : job.status === statusFilter);

      const matchesType = typeFilter === "all" || job.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [jobsWithMetrics, searchTerm, statusFilter, typeFilter]);

  // Status Change Handler
  const handleStatusChange = async (jobId, newStatus) => {
    setActionMenuJobId(null);
    setStatusUpdatingId(jobId);
    try {
      // Use updateJobStatus or updateJob
      const response = await jobService.updateJobStatus(jobId, newStatus);
      if (response && response.success) {
        setJobs((prev) =>
          prev.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j))
        );
        showToast(`Job status updated to "${newStatus}".`, "success");
      } else {
        throw new Error(response?.error || "Failed to update job status");
      }
    } catch (err) {
      console.error("Status update error:", err);
      showToast(
        err.response?.data?.error || err.message || "Failed to update job status",
        "error"
      );
    } finally {
      setStatusUpdatingId(null);
    }
  };

  // Delete Job Handler
  const confirmDeleteJob = async () => {
    if (!jobToDelete) return;
    setIsDeleting(true);
    try {
      const response = await jobService.deleteJob(jobToDelete.id);
      if (response && response.success) {
        setJobs((prev) => prev.filter((j) => j.id !== jobToDelete.id));
        showToast(`"${jobToDelete.title}" was successfully deleted.`, "success");
        setJobToDelete(null);
      } else {
        throw new Error(response?.error || "Failed to delete job posting.");
      }
    } catch (err) {
      console.error("Delete job error:", err);
      showToast(
        err.response?.data?.error || err.message || "Failed to delete job posting",
        "error"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status) => {
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
            "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
        };
      default:
        return {
          label: status || "Open",
          className:
            "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
        };
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
            <FiBriefcase className="w-3.5 h-3.5" />
            <span>Job Inventory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Manage Jobs
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Review live postings, inspect candidate volume, update lifecycle statuses, or edit job specifications.
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => fetchEmployerData(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-semibold transition-colors shadow-xs disabled:opacity-50"
          >
            <FiRefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin text-blue-600" : "text-gray-500"}`}
            />
            <span>{refreshing ? "Updating..." : "Refresh"}</span>
          </button>

          <Link
            to="/employer/post-job"
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-xs"
          >
            <FiPlus className="w-4 h-4" />
            <span>Post New Job</span>
          </Link>
        </div>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-xl border flex items-center space-x-3 animate-in fade-in transition-all ${
            notification.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
              : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300"
          }`}
        >
          {notification.type === "success" ? (
            <FiCheckCircle className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <FiAlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
          )}
          <p className="text-sm font-semibold">{notification.message}</p>
        </div>
      )}

      {/* Error Alert with Retry */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <FiAlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
            <p className="text-sm font-medium">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => fetchEmployerData(true)}
            className="inline-flex items-center justify-center px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors shrink-0"
          >
            Retry Loading
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Keyword Search */}
          <div className="relative">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by title, skills, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              {VALID_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          {/* Employment Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Employment Types</option>
              {JOB_TYPES.filter((t) => t !== "all").map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between sm:justify-end text-xs font-semibold text-gray-500 dark:text-gray-400 px-1">
            <span className="flex items-center space-x-1.5">
              <FiFilter className="w-3.5 h-3.5 text-blue-500" />
              <span>
                Showing {filteredJobs.length} of {jobs.length} positions
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Jobs Table & Cards */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 animate-pulse flex items-center justify-between"
              >
                <div className="space-y-2">
                  <div className="h-5 w-48 bg-gray-200 dark:bg-gray-800 rounded" />
                  <div className="h-3 w-32 bg-gray-200 dark:bg-gray-800 rounded" />
                </div>
                <div className="h-8 w-24 bg-gray-200 dark:bg-gray-800 rounded-lg" />
              </div>
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500 mx-auto mb-3">
              <FiBriefcase className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              {jobs.length === 0 ? "No job postings yet" : "No matching jobs found"}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
              {jobs.length === 0
                ? "Create your first job posting to start attracting and interviewing candidates."
                : "No jobs match your current filter criteria. Try resetting filters or search terms."}
            </p>
            {jobs.length === 0 ? (
              <Link
                to="/employer/post-job"
                className="mt-4 inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors"
              >
                <FiPlus className="w-4 h-4" />
                <span>Post Your First Job</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setTypeFilter("all");
                }}
                className="mt-4 inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/75 dark:bg-gray-800/40 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-3.5">Position & Details</th>
                  <th className="px-6 py-3.5">Type & Level</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Applications</th>
                  <th className="px-6 py-3.5">Timeline</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                {filteredJobs.map((job) => {
                  const statusInfo = getStatusBadge(job.status);
                  const isUpdatingStatus = statusUpdatingId === job.id;
                  const isMenuOpen = actionMenuJobId === job.id;

                  return (
                    <tr
                      key={job.id}
                      className="hover:bg-gray-50/80 dark:hover:bg-gray-850 transition-colors"
                    >
                      {/* Position & Details */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <Link
                            to={`/employer/jobs/${job.id}/applicants`}
                            className="font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors block text-base"
                          >
                            {job.title}
                          </Link>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                              {job.company}
                            </span>
                            <span>•</span>
                            <span className="flex items-center space-x-1">
                              <FiMapPin className="w-3 h-3 text-gray-400" />
                              <span>{job.location}</span>
                            </span>
                            {job.salary && (
                              <>
                                <span>•</span>
                                <span className="flex items-center space-x-1">
                                  <FiDollarSign className="w-3 h-3 text-emerald-500" />
                                  <span>{job.salary}</span>
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Type & Level */}
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-gray-200">
                            {job.type}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {job.experience}
                          </p>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center space-x-2">
                          <span
                            className={`px-2.5 py-1 text-xs font-semibold rounded-full border capitalize ${statusInfo.className}`}
                          >
                            {statusInfo.label}
                          </span>
                          {isUpdatingStatus && (
                            <FiRefreshCw className="w-3.5 h-3.5 text-blue-500 animate-spin" />
                          )}
                        </div>
                      </td>

                      {/* Applications Volume */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <Link
                            to={`/employer/jobs/${job.id}/applicants`}
                            className="inline-flex items-center space-x-1.5 font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          >
                            <FiUsers className="w-4 h-4 text-blue-500" />
                            <span>{job.applicationsCount}</span>
                            <span className="font-normal text-gray-500 text-xs">
                              total
                            </span>
                          </Link>
                          {job.pendingCount > 0 ? (
                            <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                              {job.pendingCount} awaiting review
                            </p>
                          ) : (
                            <p className="text-[11px] text-gray-400">0 pending</p>
                          )}
                        </div>
                      </td>

                      {/* Timeline */}
                      <td className="px-6 py-4">
                        <div className="text-xs space-y-1 text-gray-500 dark:text-gray-400">
                          <div className="flex items-center space-x-1">
                            <FiCalendar className="w-3.5 h-3.5" />
                            <span>
                              Posted{" "}
                              {new Date(
                                job.createdAt || job.postedDate
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                          {job.applicationDeadline && (
                            <div className="text-[11px] text-gray-400">
                              Deadline:{" "}
                              {new Date(
                                job.applicationDeadline
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="relative inline-block text-left action-menu-container">
                          <button
                            type="button"
                            onClick={() =>
                              setActionMenuJobId(isMenuOpen ? null : job.id)
                            }
                            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            aria-label="Job actions menu"
                          >
                            <FiMoreVertical className="w-5 h-5" />
                          </button>

                          {/* Action Dropdown Menu */}
                          {isMenuOpen && (
                            <div className="absolute right-0 mt-2 w-52 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl py-1 z-30 animate-in fade-in zoom-in-95 duration-100 text-left">
                              <Link
                                to={`/employer/jobs/${job.id}/applicants`}
                                className="flex items-center space-x-2.5 px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                              >
                                <FiUsers className="w-4 h-4 text-blue-500" />
                                <span>View Applicants ({job.applicationsCount})</span>
                              </Link>

                              <Link
                                to={`/employer/jobs/${job.id}/edit`}
                                className="flex items-center space-x-2.5 px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                              >
                                <FiEdit2 className="w-4 h-4 text-indigo-500" />
                                <span>Edit Job Details</span>
                              </Link>

                              <div className="border-t border-gray-100 dark:border-gray-800 my-1" />

                              {/* Lifecycle Status Toggles */}
                              <div className="px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                                Change Status
                              </div>

                              {job.status !== "active" && (
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(job.id, "active")}
                                  className="w-full flex items-center space-x-2.5 px-4 py-1.5 text-xs text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                >
                                  <FiCheckCircle className="w-3.5 h-3.5" />
                                  <span>Set as Active</span>
                                </button>
                              )}

                              {job.status !== "Draft" && (
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(job.id, "Draft")}
                                  className="w-full flex items-center space-x-2.5 px-4 py-1.5 text-xs text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                                >
                                  <FiClock className="w-3.5 h-3.5" />
                                  <span>Move to Draft</span>
                                </button>
                              )}

                              {job.status !== "Closed" && (
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(job.id, "Closed")}
                                  className="w-full flex items-center space-x-2.5 px-4 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                                >
                                  <FiXCircle className="w-3.5 h-3.5" />
                                  <span>Close Job</span>
                                </button>
                              )}

                              <div className="border-t border-gray-100 dark:border-gray-800 my-1" />

                              {/* Delete Option */}
                              <button
                                type="button"
                                onClick={() => {
                                  setActionMenuJobId(null);
                                  setJobToDelete(job);
                                }}
                                className="w-full flex items-center space-x-2.5 px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              >
                                <FiTrash2 className="w-4 h-4" />
                                <span>Delete Job Posting</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Accessible Deletion Confirmation Modal */}
      {jobToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-800 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <FiTrash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Delete Job Posting?
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  "{jobToDelete.title}"
                </span>
                ? This action cannot be undone and will permanently remove this job posting and its applicant references.
              </p>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setJobToDelete(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-semibold text-sm transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDeleteJob}
                className="flex-1 inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm transition-colors shadow-sm disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <FiRefreshCw className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <FiTrash2 className="w-4 h-4" />
                    <span>Delete Job</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageJobs;
