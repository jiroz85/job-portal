import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FiCalendar,
  FiClock,
  FiUser,
  FiMail,
  FiPhone,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiDownload,
  FiSearch,
  FiFilter,
  FiBriefcase,
  FiEdit2,
  FiExternalLink,
  FiArrowRight,
} from "react-icons/fi";
import { applicationService } from "../../services/applicationService";
import { jobService } from "../../services/jobService";

const InterviewManagement = () => {
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState("all"); // 'all' | 'interview_scheduled' | 'interviewed'
  const [selectedJobId, setSelectedJobId] = useState("all");

  // Status update modal
  const [statusModalTarget, setStatusModalTarget] = useState(null);
  const [newStatus, setNewStatus] = useState("interviewed");
  const [statusNotes, setStatusNotes] = useState("");
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);
  const [downloadingResumeId, setDownloadingResumeId] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && statusModalTarget) {
        setStatusModalTarget(null);
      }
    };
    if (statusModalTarget) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [statusModalTarget]);

  // Load real applications and jobs
  const fetchInterviewData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      setError(null);
      const [appsRes, jobsRes] = await Promise.all([
        applicationService.getAllApplications({ limit: 100 }),
        jobService.getMyJobs({ limit: 100 }),
      ]);

      const fetchedApps =
        appsRes?.success && Array.isArray(appsRes.data) ? appsRes.data : [];
      const fetchedJobs =
        jobsRes?.success && Array.isArray(jobsRes.data) ? jobsRes.data : [];

      setApplications(fetchedApps);
      setJobs(fetchedJobs);
    } catch (err) {
      console.error("Failed to load interview candidates:", err);
      setError(
        err.response?.data?.error ||
          err.message ||
          "Failed to load interview data. Please check your connection."
      );
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchInterviewData(false);
  }, [fetchInterviewData]);

  // Filter candidates specifically in interview stages
  const interviewCandidates = useMemo(() => {
    return applications.filter(
      (app) =>
        app.status === "interview_scheduled" || app.status === "interviewed"
    );
  }, [applications]);

  // Additional filtered list based on user search & tab selections
  const filteredCandidates = useMemo(() => {
    return interviewCandidates.filter((app) => {
      const term = searchTerm.toLowerCase().trim();
      const applicantName = (
        app.user?.name ||
        app.applicantName ||
        app.name ||
        ""
      ).toLowerCase();
      const applicantEmail = (
        app.user?.email ||
        app.applicantEmail ||
        app.email ||
        ""
      ).toLowerCase();
      const jobTitle = (app.job?.title || "").toLowerCase();

      const matchesSearch =
        !term ||
        applicantName.includes(term) ||
        applicantEmail.includes(term) ||
        jobTitle.includes(term);

      const matchesStage =
        stageFilter === "all" || app.status === stageFilter;

      const matchesJob =
        selectedJobId === "all" ||
        String(app.jobId || app.job?.id) === String(selectedJobId);

      return matchesSearch && matchesStage && matchesJob;
    });
  }, [interviewCandidates, searchTerm, stageFilter, selectedJobId]);

  // Metrics
  const scheduledCount = useMemo(
    () =>
      interviewCandidates.filter(
        (app) => app.status === "interview_scheduled"
      ).length,
    [interviewCandidates]
  );

  const completedCount = useMemo(
    () =>
      interviewCandidates.filter((app) => app.status === "interviewed").length,
    [interviewCandidates]
  );

  // Resume download
  const handleDownloadResume = async (app) => {
    const candidateName =
      app.user?.name || app.applicantName || app.name || "Candidate";
    setDownloadingResumeId(app.id);
    try {
      await applicationService.downloadResume(app.id, candidateName);
      showToast(`Resume downloaded for ${candidateName}`);
    } catch (err) {
      console.error("Resume download error:", err);
      showToast(
        err.message || "No resume file available for this applicant.",
        "error"
      );
    } finally {
      setDownloadingResumeId(null);
    }
  };

  // Open status modal
  const openStatusModal = (app) => {
    setStatusModalTarget(app);
    setNewStatus(
      app.status === "interview_scheduled" ? "interviewed" : "offered"
    );
    setStatusNotes(app.notes || "");
  };

  // Submit status transition
  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!statusModalTarget) return;

    setIsSubmittingStatus(true);
    const prevApps = [...applications];

    // Optimistic UI update
    setApplications((prev) =>
      prev.map((app) =>
        app.id === statusModalTarget.id
          ? { ...app, status: newStatus, notes: statusNotes }
          : app
      )
    );

    try {
      const response = await applicationService.updateApplicationStatus(
        statusModalTarget.id,
        newStatus,
        statusNotes
      );

      if (response?.success) {
        showToast(`Candidate moved to ${newStatus.replace("_", " ")}`);
        setStatusModalTarget(null);
      } else {
        throw new Error(response?.error || "Status update was not confirmed");
      }
    } catch (err) {
      console.error("Status update error:", err);
      // Revert optimistic update
      setApplications(prevApps);
      showToast(
        err.response?.data?.error ||
          err.message ||
          "Failed to update candidate status. Reverted changes.",
        "error"
      );
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium flex items-center space-x-2 transition-all ${
            toast.type === "error"
              ? "bg-red-50 dark:bg-red-950/90 text-red-800 dark:text-red-200 border-red-200 dark:border-red-900"
              : "bg-emerald-50 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-900"
          }`}
          role="alert"
        >
          {toast.type === "error" ? (
            <FiAlertCircle className="w-4 h-4 shrink-0" />
          ) : (
            <FiCheckCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Interview Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track, evaluate, and advance applicants in the interview stage
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-auto">
          <Link
            to="/employer/applicants"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-xs"
          >
            <FiUser className="w-3.5 h-3.5" />
            <span>All Applicants</span>
          </Link>
          <button
            type="button"
            onClick={() => fetchInterviewData(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-xs disabled:opacity-50"
          >
            <FiRefreshCw
              className={`w-3.5 h-3.5 ${
                refreshing ? "animate-spin text-blue-600" : "text-gray-500"
              }`}
            />
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
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
            onClick={() => fetchInterviewData(true)}
            className="inline-flex items-center justify-center px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors shrink-0"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200/60 dark:border-purple-800/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <FiCalendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Total In Pipeline
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
              {interviewCandidates.length}
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <FiClock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Scheduled Interviews
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
              {scheduledCount}
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <FiCheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Completed / Interviewed
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
              {completedCount}
            </p>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search candidate, email, or job title..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filter Dropdowns & Stage Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Stage Filter */}
          <div className="flex p-1 rounded-xl bg-gray-100 dark:bg-gray-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setStageFilter("all")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                stageFilter === "all"
                  ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-xs"
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              All ({interviewCandidates.length})
            </button>
            <button
              type="button"
              onClick={() => setStageFilter("interview_scheduled")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                stageFilter === "interview_scheduled"
                  ? "bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Scheduled ({scheduledCount})
            </button>
            <button
              type="button"
              onClick={() => setStageFilter("interviewed")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                stageFilter === "interviewed"
                  ? "bg-white dark:bg-gray-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Completed ({completedCount})
            </button>
          </div>

          {/* Job Filter Dropdown */}
          {jobs.length > 0 && (
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Jobs</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Candidates List / Loading / Empty */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 animate-pulse space-y-4"
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-800" />
                <div className="space-y-2">
                  <div className="h-4 w-40 bg-gray-200 dark:bg-gray-800 rounded" />
                  <div className="h-3 w-28 bg-gray-200 dark:bg-gray-800 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredCandidates.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200/60 dark:border-purple-800/60 flex items-center justify-center text-purple-600 dark:text-purple-400 mx-auto mb-4">
            <FiCalendar className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {interviewCandidates.length === 0
              ? "No interview candidates yet"
              : "No matching interview candidates"}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mt-2">
            {interviewCandidates.length === 0
              ? "Review candidates in Applicant Tracking and advance shortlisted applicants to 'Interview Scheduled' to manage their evaluation here."
              : "Try adjusting your search keyword or selected job filter."}
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              to="/employer/applicants"
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs"
            >
              <span>View Applicant Tracking</span>
              <FiArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCandidates.map((app) => {
            const candidateName =
              app.user?.name || app.applicantName || app.name || "Candidate";
            const candidateEmail =
              app.user?.email || app.applicantEmail || app.email || "No email";
            const appliedDate = app.createdAt
              ? new Date(app.createdAt).toLocaleDateString()
              : "Recently";

            return (
              <div
                key={app.id}
                className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Candidate Info */}
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-base shrink-0 shadow-sm">
                    {candidateName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-gray-900 dark:text-white">
                        {candidateName}
                      </h3>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          app.status === "interview_scheduled"
                            ? "bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300"
                            : "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300"
                        }`}
                      >
                        {app.status === "interview_scheduled"
                          ? "Interview Scheduled"
                          : "Interviewed"}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center space-x-1 font-medium text-gray-700 dark:text-gray-300">
                        <FiBriefcase className="w-3.5 h-3.5" />
                        <span>{app.job?.title || "Job Posting"}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <FiMail className="w-3.5 h-3.5" />
                        <span>{candidateEmail}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <FiCalendar className="w-3.5 h-3.5" />
                        <span>Applied: {appliedDate}</span>
                      </span>
                    </div>

                    {/* Interview Notes / Feedback */}
                    {app.notes && (
                      <div className="mt-2 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 text-xs text-gray-600 dark:text-gray-300">
                        <span className="font-semibold text-gray-700 dark:text-gray-200">
                          Notes / Evaluation:{" "}
                        </span>
                        {app.notes}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 self-end md:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => handleDownloadResume(app)}
                    disabled={downloadingResumeId === app.id}
                    className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-xs disabled:opacity-50"
                  >
                    <FiDownload
                      className={`w-3.5 h-3.5 ${
                        downloadingResumeId === app.id ? "animate-bounce" : ""
                      }`}
                    />
                    <span>
                      {downloadingResumeId === app.id
                        ? "Downloading..."
                        : "Resume"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openStatusModal(app)}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs"
                  >
                    <FiEdit2 className="w-3.5 h-3.5" />
                    <span>Update Status</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Status Update Modal */}
      {statusModalTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full p-6 border border-gray-200 dark:border-gray-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Update Candidate Pipeline Stage
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {statusModalTarget.user?.name ||
                    statusModalTarget.applicantName ||
                    statusModalTarget.name ||
                    "Candidate"}{" "}
                  — {statusModalTarget.job?.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStatusModalTarget(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Close modal"
              >
                <FiXCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                  Next Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="interview_scheduled">
                    Interview Scheduled
                  </option>
                  <option value="interviewed">
                    Interviewed (Evaluation Complete)
                  </option>
                  <option value="offered">Extend Job Offer</option>
                  <option value="accepted">Accepted / Hired</option>
                  <option value="rejected">Reject Candidate</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                  Interviewer Feedback / Schedule Notes
                </label>
                <textarea
                  rows={4}
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="E.g., Candidate performed well on algorithmic questions; recommend for next interview round on Friday at 2:00 PM."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setStatusModalTarget(null)}
                  disabled={isSubmittingStatus}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingStatus}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs disabled:opacity-50"
                >
                  {isSubmittingStatus ? "Updating..." : "Save Status"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewManagement;
