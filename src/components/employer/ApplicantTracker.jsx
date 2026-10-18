import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FiUsers,
  FiEye,
  FiDownload,
  FiMail,
  FiPhone,
  FiCalendar,
  FiMapPin,
  FiBriefcase,
  FiFilter,
  FiSearch,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiStar,
  FiArrowLeft,
  FiRefreshCw,
  FiAlertCircle,
  FiFileText,
  FiDollarSign,
  FiEdit3,
} from "react-icons/fi";
import { applicationService } from "../../services/applicationService";
import { jobService } from "../../services/jobService";

const VALID_STATUSES = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending Review" },
  { value: "under_review", label: "Under Review" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "interview_scheduled", label: "Interview Scheduled" },
  { value: "interviewed", label: "Interviewed" },
  { value: "offered", label: "Offer Extended" },
  { value: "accepted", label: "Accepted / Hired" },
  { value: "rejected", label: "Rejected" },
  { value: "withdrawn", label: "Withdrawn" },
];

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    badgeClass:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
    icon: FiClock,
  },
  under_review: {
    label: "Under Review",
    badgeClass:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
    icon: FiEye,
  },
  shortlisted: {
    label: "Shortlisted",
    badgeClass:
      "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800",
    icon: FiStar,
  },
  interview_scheduled: {
    label: "Interview Scheduled",
    badgeClass:
      "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800",
    icon: FiCalendar,
  },
  interviewed: {
    label: "Interviewed",
    badgeClass:
      "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-400 dark:border-cyan-800",
    icon: FiCheckCircle,
  },
  offered: {
    label: "Offer Extended",
    badgeClass:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
    icon: FiCheckCircle,
  },
  accepted: {
    label: "Hired",
    badgeClass:
      "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-800",
    icon: FiCheckCircle,
  },
  rejected: {
    label: "Rejected",
    badgeClass:
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800",
    icon: FiXCircle,
  },
  withdrawn: {
    label: "Withdrawn",
    badgeClass:
      "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
    icon: FiXCircle,
  },
};

const ApplicantTracker = ({ jobId = null }) => {
  const [job, setJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [employerJobs, setEmployerJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedJobFilter, setSelectedJobFilter] = useState(jobId ? String(jobId) : "all");

  // Candidate detail modal & actions
  const [activeApplicant, setActiveApplicant] = useState(null);
  const [downloadingResumeId, setDownloadingResumeId] = useState(null);
  const [statusChangeTarget, setStatusChangeTarget] = useState(null);
  const [statusNotes, setStatusNotes] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch data
  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      setError(null);

      // Load specific job details if in per-job mode
      if (jobId) {
        const jobRes = await jobService.getJobById(jobId);
        if (jobRes?.success && jobRes.data) {
          setJob(jobRes.data);
        }
      } else {
        // Load employer jobs for filter dropdown
        const jobsRes = await jobService.getMyJobs({ limit: 100 });
        if (jobsRes?.success && Array.isArray(jobsRes.data)) {
          setEmployerJobs(jobsRes.data);
        }
      }

      // Fetch applications (scoped by jobId if provided)
      const appsParams = { limit: 100 };
      if (jobId) {
        appsParams.jobId = jobId;
      }

      const appsRes = await applicationService.getAllApplications(appsParams);
      const list = appsRes?.success && Array.isArray(appsRes.data) ? appsRes.data : [];
      setApplicants(list);
    } catch (err) {
      console.error("Failed to load applicants:", err);
      const errMsg =
        err.response?.data?.error ||
        err.message ||
        "Failed to load applications. Please check your network connection.";
      setError(errMsg);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchData(false);

    const handleApplicationSubmitted = () => {
      fetchData(false);
    };

    window.addEventListener("applicationSubmitted", handleApplicationSubmitted);
    return () => {
      window.removeEventListener("applicationSubmitted", handleApplicationSubmitted);
    };
  }, [fetchData]);

  // ESC key listener to dismiss open modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (statusChangeTarget) {
          setStatusChangeTarget(null);
        } else if (activeApplicant) {
          setActiveApplicant(null);
        }
      }
    };
    if (activeApplicant || statusChangeTarget) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeApplicant, statusChangeTarget]);

  // Derived applicant counts
  const pipelineMetrics = useMemo(() => {
    const total = applicants.length;
    const pending = applicants.filter((a) => a.status === "pending").length;
    const underReview = applicants.filter((a) => a.status === "under_review").length;
    const shortlisted = applicants.filter((a) => a.status === "shortlisted").length;
    const inInterview = applicants.filter(
      (a) => a.status === "interview_scheduled" || a.status === "interviewed"
    ).length;
    const hired = applicants.filter((a) => a.status === "accepted").length;
    return { total, pending, underReview, shortlisted, inInterview, hired };
  }, [applicants]);

  // Filtered applicants
  const filteredApplicants = useMemo(() => {
    return applicants.filter((app) => {
      const term = searchTerm.toLowerCase().trim();
      const skillsStr = Array.isArray(app.skills)
        ? app.skills.join(" ")
        : app.skills || "";

      const matchesSearch =
        !term ||
        app.applicantName?.toLowerCase().includes(term) ||
        app.applicantEmail?.toLowerCase().includes(term) ||
        app.applicantPhone?.toLowerCase().includes(term) ||
        app.job?.title?.toLowerCase().includes(term) ||
        skillsStr.toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === "all" || app.status === statusFilter;

      const matchesJob =
        jobId ||
        selectedJobFilter === "all" ||
        String(app.jobId) === String(selectedJobFilter);

      return matchesSearch && matchesStatus && matchesJob;
    });
  }, [applicants, searchTerm, statusFilter, selectedJobFilter, jobId]);

  // Status Change Execution
  const handleExecuteStatusChange = async (targetApplicant, newStatus, notes) => {
    setIsUpdatingStatus(true);
    try {
      const response = await applicationService.updateApplicationStatus(
        targetApplicant.id,
        {
          status: newStatus,
          notes: notes || undefined,
        }
      );

      if (response && response.success) {
        const updated = response.data || {
          ...targetApplicant,
          status: newStatus,
          notes: notes || targetApplicant.notes,
        };

        // Update list
        setApplicants((prev) =>
          prev.map((a) => (a.id === targetApplicant.id ? { ...a, ...updated } : a))
        );

        // Update detail modal if open
        if (activeApplicant && activeApplicant.id === targetApplicant.id) {
          setActiveApplicant((prev) => ({ ...prev, ...updated }));
        }

        showToast(
          `Candidate marked as "${STATUS_CONFIG[newStatus]?.label || newStatus}".`,
          "success"
        );
        setStatusChangeTarget(null);
        setStatusNotes("");
      } else {
        throw new Error(response?.error || "Failed to update status");
      }
    } catch (err) {
      console.error("Status update error:", err);
      showToast(
        err.response?.data?.error || err.message || "Failed to update application status",
        "error"
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Resume Download Handler
  const handleDownloadResume = async (applicant) => {
    if (!applicant.resumePath) {
      showToast("No resume file was attached to this application.", "error");
      return;
    }

    setDownloadingResumeId(applicant.id);
    try {
      await applicationService.downloadResume(applicant.id, applicant.applicantName);
      showToast("Resume downloaded successfully.", "success");
    } catch (err) {
      console.error("Download resume error:", err);
      showToast(
        err.message || "Unable to download resume. File may be unavailable on storage.",
        "error"
      );
    } finally {
      setDownloadingResumeId(null);
    }
  };

  const getInitials = (name) => {
    if (!name || typeof name !== "string") return "AP";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`p-4 rounded-xl border flex items-center space-x-3 animate-in fade-in transition-all ${
            toast.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
              : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300"
          }`}
        >
          {toast.type === "success" ? (
            <FiCheckCircle className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <FiAlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
          )}
          <p className="text-sm font-semibold">{toast.message}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
        <div>
          {jobId ? (
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                <Link
                  to="/employer/jobs"
                  className="hover:underline flex items-center space-x-1"
                >
                  <FiArrowLeft className="w-3.5 h-3.5" />
                  <span>Manage Jobs</span>
                </Link>
                <span>/</span>
                <span>Job Applicants</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                {job?.title || "Job Applicants"}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {job?.company} • {job?.location} • {job?.type}
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
                <FiUsers className="w-3.5 h-3.5" />
                <span>Candidate Pipeline</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                Applicant Tracking
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Screen applications, inspect qualifications, advance stages, and review resumes.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => fetchData(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-semibold transition-colors shadow-xs disabled:opacity-50"
          >
            <FiRefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin text-blue-600" : "text-gray-500"}`}
            />
            <span>{refreshing ? "Updating..." : "Refresh"}</span>
          </button>

          {jobId && (
            <Link
              to="/employer/applicants"
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-200 transition-colors shadow-xs"
            >
              <span>View All Applicants</span>
            </Link>
          )}
        </div>
      </div>

      {/* Error Alert with Retry */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <FiAlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
            <p className="text-sm font-medium">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => fetchData(true)}
            className="inline-flex items-center justify-center px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors shrink-0"
          >
            Retry Loading
          </button>
        </div>
      )}

      {/* Pipeline KPI Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Total
          </span>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {pipelineMetrics.total}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Pending
          </span>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {pipelineMetrics.pending}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Reviewing
          </span>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {pipelineMetrics.underReview}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
            Shortlisted
          </span>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {pipelineMetrics.shortlisted}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Interview
          </span>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {pipelineMetrics.inInterview}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Hired
          </span>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {pipelineMetrics.hired}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Keyword Search */}
          <div className="relative">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name, email, skills..."
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

          {/* Job Filter (visible only in general view) */}
          {!jobId && (
            <div>
              <select
                value={selectedJobFilter}
                onChange={(e) => setSelectedJobFilter(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">All Jobs</option>
                {employerJobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Count Badge */}
          <div className="flex items-center justify-between sm:justify-end text-xs font-semibold text-gray-500 dark:text-gray-400 px-1">
            <span className="flex items-center space-x-1.5">
              <FiFilter className="w-3.5 h-3.5 text-blue-500" />
              <span>
                Showing {filteredApplicants.length} of {applicants.length} candidates
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Applicants List */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 animate-pulse flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800" />
                  <div className="space-y-2">
                    <div className="h-4 w-36 bg-gray-200 dark:bg-gray-800 rounded" />
                    <div className="h-3 w-28 bg-gray-200 dark:bg-gray-800 rounded" />
                  </div>
                </div>
                <div className="h-8 w-24 bg-gray-200 dark:bg-gray-800 rounded-lg" />
              </div>
            ))}
          </div>
        ) : filteredApplicants.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500 mx-auto mb-3">
              <FiUsers className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              {applicants.length === 0 ? "No applications received yet" : "No matching candidates"}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
              {applicants.length === 0
                ? "Once candidates apply to your posted vacancies, their profiles will appear here for review."
                : "No applications match your selected filter or keyword search. Try clearing filters."}
            </p>
            {searchTerm || statusFilter !== "all" || selectedJobFilter !== "all" ? (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setSelectedJobFilter(jobId ? String(jobId) : "all");
                }}
                className="mt-4 inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <span>Reset Filters</span>
              </button>
            ) : null}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/75 dark:bg-gray-800/40 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-3.5">Candidate</th>
                  <th className="px-6 py-3.5">Position</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Submitted</th>
                  <th className="px-6 py-3.5">Resume</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                {filteredApplicants.map((applicant) => {
                  const statusConfig = STATUS_CONFIG[applicant.status] || {
                    label: applicant.status,
                    badgeClass: "bg-gray-100 text-gray-700 border-gray-300",
                    icon: FiClock,
                  };
                  const StatusIcon = statusConfig.icon;
                  const hasResume = Boolean(applicant.resumePath);
                  const isDownloading = downloadingResumeId === applicant.id;

                  return (
                    <tr
                      key={applicant.id}
                      className="hover:bg-gray-50/80 dark:hover:bg-gray-850 transition-colors"
                    >
                      {/* Candidate Name & Contact */}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3.5">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-semibold text-xs shrink-0 shadow-xs">
                            {getInitials(applicant.applicantName)}
                          </div>
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => setActiveApplicant(applicant)}
                              className="font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left truncate block"
                            >
                              {applicant.applicantName}
                            </button>
                            <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              <span className="flex items-center space-x-1">
                                <FiMail className="w-3 h-3 text-gray-400" />
                                <span>{applicant.applicantEmail}</span>
                              </span>
                              {applicant.applicantPhone && (
                                <span className="hidden md:flex items-center space-x-1">
                                  <FiPhone className="w-3 h-3 text-gray-400" />
                                  <span>{applicant.applicantPhone}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Position */}
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-gray-200">
                            {applicant.job?.title || "Role #" + applicant.jobId}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {applicant.job?.company || "Your Company"}
                          </p>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${statusConfig.badgeClass}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          <span>{statusConfig.label}</span>
                        </span>
                      </td>

                      {/* Submitted Date */}
                      <td className="px-6 py-4">
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-1">
                          <FiCalendar className="w-3.5 h-3.5" />
                          <span>
                            {new Date(
                              applicant.applicationDate || applicant.createdAt
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Resume */}
                      <td className="px-6 py-4">
                        {hasResume ? (
                          <button
                            type="button"
                            onClick={() => handleDownloadResume(applicant)}
                            disabled={isDownloading}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 transition-colors disabled:opacity-50"
                          >
                            <FiDownload className={`w-3 h-3 ${isDownloading ? "animate-bounce" : ""}`} />
                            <span>{isDownloading ? "Downloading..." : "Resume"}</span>
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 italic">None</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => setActiveApplicant(applicant)}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 bg-blue-50/50 dark:bg-blue-950/20 transition-colors"
                          >
                            <FiEye className="w-3.5 h-3.5" />
                            <span>Review</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setStatusChangeTarget(applicant);
                              setStatusNotes(applicant.notes || "");
                            }}
                            className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-300 dark:border-gray-700 transition-colors"
                          >
                            <FiEdit3 className="w-3.5 h-3.5" />
                            <span>Status</span>
                          </button>
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

      {/* Candidate Full Profile Review Modal */}
      {activeApplicant && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-800 shadow-2xl p-6 sm:p-8 space-y-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                  {getInitials(activeApplicant.applicantName)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {activeApplicant.applicantName}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Applying for{" "}
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      {activeApplicant.job?.title || "Role #" + activeApplicant.jobId}
                    </span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveApplicant(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Close applicant modal"
              >
                <FiXCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Candidate Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4 rounded-xl bg-gray-50/75 dark:bg-gray-800/40 border border-gray-200/60 dark:border-gray-700/60 text-xs">
              <div>
                <span className="text-gray-400 block font-medium">Email Address</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200 break-all">
                  {activeApplicant.applicantEmail}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block font-medium">Phone Number</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {activeApplicant.applicantPhone || "Not provided"}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block font-medium">Application Date</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {new Date(
                    activeApplicant.applicationDate || activeApplicant.createdAt
                  ).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block font-medium">Availability</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {activeApplicant.availability || "Immediate"}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block font-medium">Expected Salary</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {activeApplicant.expectedSalary || "Not specified"}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block font-medium">Current Status</span>
                <span
                  className={`inline-block font-semibold px-2 py-0.5 mt-0.5 rounded-full border text-[11px] ${
                    STATUS_CONFIG[activeApplicant.status]?.badgeClass || "bg-gray-100 text-gray-800"
                  }`}
                >
                  {STATUS_CONFIG[activeApplicant.status]?.label || activeApplicant.status}
                </span>
              </div>
            </div>

            {/* Experience & Education */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeApplicant.experience && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center space-x-1.5">
                    <FiBriefcase className="w-3.5 h-3.5 text-blue-500" />
                    <span>Relevant Experience</span>
                  </h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed bg-white dark:bg-gray-800/80 p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 whitespace-pre-line">
                    {activeApplicant.experience}
                  </p>
                </div>
              )}

              {activeApplicant.education && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center space-x-1.5">
                    <FiFileText className="w-3.5 h-3.5 text-blue-500" />
                    <span>Education Background</span>
                  </h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed bg-white dark:bg-gray-800/80 p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 whitespace-pre-line">
                    {activeApplicant.education}
                  </p>
                </div>
              )}
            </div>

            {/* Skills */}
            {activeApplicant.skills && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Key Skills & Competencies
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {(Array.isArray(activeApplicant.skills)
                    ? activeApplicant.skills
                    : activeApplicant.skills.split(",")
                  ).map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60"
                    >
                      {typeof s === "string" ? s.trim() : s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Cover Letter */}
            {activeApplicant.coverLetter && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Cover Letter
                </h4>
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                  {activeApplicant.coverLetter}
                </div>
              </div>
            )}

            {/* Internal Notes */}
            {activeApplicant.notes && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center space-x-1.5">
                  <FiEdit3 className="w-3.5 h-3.5 text-amber-500" />
                  <span>Internal Employer Notes</span>
                </h4>
                <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200">
                  {activeApplicant.notes}
                </div>
              </div>
            )}

            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              {activeApplicant.resumePath ? (
                <button
                  type="button"
                  onClick={() => handleDownloadResume(activeApplicant)}
                  disabled={downloadingResumeId === activeApplicant.id}
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-300 transition-colors disabled:opacity-50"
                >
                  <FiDownload className="w-4 h-4 text-blue-500" />
                  <span>
                    {downloadingResumeId === activeApplicant.id
                      ? "Downloading Resume..."
                      : "Download Candidate Resume"}
                  </span>
                </button>
              ) : (
                <span className="text-xs text-gray-400 italic">No resume attached</span>
              )}

              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setStatusChangeTarget(activeApplicant);
                    setStatusNotes(activeApplicant.notes || "");
                  }}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors shadow-sm"
                >
                  <FiEdit3 className="w-4 h-4" />
                  <span>Update Status</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Update & Notes Modal */}
      {statusChangeTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full p-6 sm:p-8 border border-gray-200 dark:border-gray-800 shadow-2xl space-y-5">
            <div className="flex items-start justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Update Candidate Status
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {statusChangeTarget.applicantName} •{" "}
                  {statusChangeTarget.job?.title || "Role #" + statusChangeTarget.jobId}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStatusChangeTarget(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <FiXCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Status Selectors */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                Select Pipeline Stage
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {VALID_STATUSES.filter((s) => s.value !== "all").map((s) => {
                  const isCurrent = statusChangeTarget.status === s.value;
                  return (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() =>
                        handleExecuteStatusChange(statusChangeTarget, s.value, statusNotes)
                      }
                      disabled={isUpdatingStatus}
                      className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                        isCurrent
                          ? "border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20"
                          : "border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/40 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      } disabled:opacity-50`}
                    >
                      <span className="truncate">{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Internal Notes input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                Internal Evaluation Notes (Saved with status)
              </label>
              <textarea
                rows={3}
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                placeholder="Candidate feedback, screening impressions, salary requirements, interview highlights..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setStatusChangeTarget(null)}
                className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={() =>
                  handleExecuteStatusChange(
                    statusChangeTarget,
                    statusChangeTarget.status,
                    statusNotes
                  )
                }
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
              >
                {isUpdatingStatus ? "Saving Notes..." : "Save Notes Only"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicantTracker;
