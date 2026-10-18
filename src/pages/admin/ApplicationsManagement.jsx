import React, { useState, useEffect, useCallback } from "react";
import {
  FiSearch,
  FiEye,
  FiDownload,
  FiCalendar,
  FiUser,
  FiBriefcase,
  FiMail,
  FiPhone,
  FiTrash2,
  FiEdit2,
  FiCheckCircle,
  FiAlertCircle,
  FiX,
  FiRefreshCw,
  FiFileText,
  FiDollarSign,
  FiClock,
  FiChevronDown,
} from "react-icons/fi";
import { applicationService } from "../../services/applicationService";
import jobApi from "../../services/jobApi";

const ApplicationsManagement = () => {
  // Query state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [jobFilter, setJobFilter] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 10;

  // Data & loading state
  const [applications, setApplications] = useState([]);
  const [jobsList, setJobsList] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalApplications: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals state
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Selected item state
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [newStatus, setNewStatus] = useState("pending");
  const [reviewerNotes, setReviewerNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [downloadLoadingId, setDownloadLoadingId] = useState(null);

  // Notifications state
  const [notification, setNotification] = useState(null);

  const showFeedback = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  // Load jobs list for the job dropdown filter
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await jobApi.getAllJobsAdmin({ limit: 100 });
        if (res.success && res.data?.jobs) {
          setJobsList(res.data.jobs);
        }
      } catch (err) {
        console.error("Error loading jobs for filter:", err);
      }
    };
    fetchJobs();
  }, []);

  // Fetch applications from server
  const loadApplications = useCallback(
    async (
      targetPage = page,
      search = searchTerm,
      status = statusFilter,
      jobId = jobFilter
    ) => {
      setLoading(true);
      setError(null);
      try {
        const response = await applicationService.getAllApplications({
          page: targetPage,
          limit,
          search,
          status,
          jobId,
        });

        if (response.success) {
          const list = response.data || [];
          setApplications(list);
          setPagination({
            currentPage: response.pagination?.page || targetPage,
            totalPages: response.pagination?.pages || 1,
            totalApplications: response.pagination?.total ?? list.length,
            hasNext: (response.pagination?.page || targetPage) < (response.pagination?.pages || 1),
            hasPrev: (response.pagination?.page || targetPage) > 1,
          });
        } else {
          throw new Error(response.error || "Failed to load applications");
        }
      } catch (err) {
        console.error("Error loading applications:", err);
        setError(err.response?.data?.error || err.message || "Failed to load applications");
      } finally {
        setLoading(false);
      }
    },
    [page, searchTerm, statusFilter, jobFilter]
  );

  // Debounced search & filter trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      loadApplications(page, searchTerm, statusFilter, jobFilter);
    }, 300);

    return () => clearTimeout(timer);
  }, [loadApplications, page, searchTerm, statusFilter, jobFilter]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const handleJobFilterChange = (e) => {
    setJobFilter(e.target.value);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setJobFilter("all");
    setPage(1);
  };

  const getStatusBadgeClasses = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300";
      case "under_review":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300";
      case "shortlisted":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300";
      case "interview_scheduled":
      case "interviewed":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300";
      case "offered":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300";
      case "accepted":
        return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";
      case "withdrawn":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const formatStatus = (status) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "under_review":
        return "Under Review";
      case "shortlisted":
        return "Shortlisted";
      case "interview_scheduled":
        return "Interview Scheduled";
      case "interviewed":
        return "Interviewed";
      case "offered":
        return "Offered";
      case "accepted":
        return "Accepted";
      case "rejected":
        return "Rejected";
      case "withdrawn":
        return "Withdrawn";
      default:
        return status || "Unknown";
    }
  };

  // View details
  const handleViewDetails = (application) => {
    setSelectedApplication(application);
    setShowDetailsModal(true);
  };

  // Open status modal
  const handleOpenStatusModal = (application) => {
    setSelectedApplication(application);
    setNewStatus(application.status || "pending");
    setReviewerNotes(application.notes || "");
    setShowStatusModal(true);
  };

  // Submit status update
  const handleUpdateStatus = async () => {
    if (!selectedApplication) return;
    setActionLoading(true);
    try {
      const response = await applicationService.updateApplicationStatus(
        selectedApplication.id,
        {
          status: newStatus,
          notes: reviewerNotes,
        }
      );

      if (response.success) {
        showFeedback(
          "success",
          `Status for ${selectedApplication.applicantName} updated to "${formatStatus(newStatus)}"`
        );
        setShowStatusModal(false);
        setSelectedApplication(null);
        loadApplications();
      } else {
        throw new Error(response.error || "Failed to update application status");
      }
    } catch (err) {
      console.error("Error updating application status:", err);
      showFeedback(
        "error",
        err.response?.data?.error || err.message || "Failed to update status"
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Real resume download
  const handleDownloadResume = async (application) => {
    if (!application?.resumePath && !application?.resume) {
      showFeedback("error", "No resume file attached to this application.");
      return;
    }

    setDownloadLoadingId(application.id);
    try {
      await applicationService.downloadResume(application.id, application.applicantName);
      showFeedback("success", `Resume downloaded for ${application.applicantName}`);
    } catch (err) {
      console.error("Error downloading resume:", err);
      showFeedback("error", err.message || "Failed to download candidate resume.");
    } finally {
      setDownloadLoadingId(null);
    }
  };

  // Open delete modal
  const handleOpenDelete = (application) => {
    setSelectedApplication(application);
    setShowDeleteModal(true);
  };

  // Submit delete application
  const handleDeleteApplication = async () => {
    if (!selectedApplication) return;
    setActionLoading(true);
    try {
      const response = await applicationService.deleteApplication(selectedApplication.id);
      if (response.success) {
        showFeedback(
          "success",
          `Application from ${selectedApplication.applicantName} was deleted`
        );
        setShowDeleteModal(false);
        setSelectedApplication(null);
        loadApplications();
      } else {
        throw new Error(response.error || "Failed to delete application");
      }
    } catch (err) {
      console.error("Error deleting application:", err);
      showFeedback(
        "error",
        err.response?.data?.error || err.message || "Failed to delete application"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const renderSkills = (skills) => {
    if (!skills) return <span className="text-gray-400 italic">None specified</span>;
    let list = [];
    if (Array.isArray(skills)) {
      list = skills;
    } else if (typeof skills === "string") {
      list = skills.split(",").map((s) => s.trim()).filter(Boolean);
    }
    if (list.length === 0) return <span className="text-gray-400 italic">None specified</span>;

    return (
      <div className="flex flex-wrap gap-1.5 mt-1">
        {list.map((skill, index) => (
          <span
            key={index}
            className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
          >
            {skill}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            Application Moderation & Tracking
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
            Review candidate applications across all jobs, moderate application statuses, inspect resumes, and manage submissions.
          </p>
        </div>
        <button
          onClick={() => loadApplications()}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-colors"
        >
          <FiRefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          role="alert"
          className={`flex items-center justify-between p-4 rounded-lg shadow-sm text-sm border ${
            notification.type === "success"
              ? "bg-green-50 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
              : "bg-red-50 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <FiCheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <FiAlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            aria-label="Dismiss alert"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by applicant name or email..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-10 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                aria-label="Clear search"
              >
                <FiX className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-52 relative">
            <select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              className="w-full appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="interview_scheduled">Interview Scheduled</option>
              <option value="interviewed">Interviewed</option>
              <option value="offered">Offered</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-4 h-4" />
          </div>

          {/* Job Filter */}
          <div className="w-full md:w-56 relative">
            <select
              value={jobFilter}
              onChange={handleJobFilterChange}
              className="w-full appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Jobs</option>
              {jobsList.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} ({j.company})
                </option>
              ))}
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading applications from database...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <FiAlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <p className="text-base font-semibold text-gray-900 dark:text-white">Unable to load applications</p>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1 mb-4">{error}</p>
            <button
              onClick={() => loadApplications()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center">
            <FiFileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-base font-medium text-gray-900 dark:text-white">No applications found</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">
              {searchTerm || statusFilter !== "all" || jobFilter !== "all"
                ? "No applications match your filter criteria."
                : "No applications have been submitted yet."}
            </p>
            {(searchTerm || statusFilter !== "all" || jobFilter !== "all") && (
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Applicant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Job Title & Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Applied Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Resume
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {applications.map((app) => (
                    <tr
                      key={app.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-sm">
                            {app.applicantName ? app.applicantName.charAt(0).toUpperCase() : "A"}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {app.applicantName}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <FiMail className="w-3.5 h-3.5" />
                              <span>{app.applicantEmail}</span>
                            </div>
                            {app.applicantPhone && (
                              <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5">
                                <FiPhone className="w-3 h-3" />
                                <span>{app.applicantPhone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {app.job?.title || `Job #${app.jobId}`}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {app.job?.company || "Unknown Company"}
                          {app.job?.location ? ` • ${app.job.location}` : ""}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1.5">
                          <FiCalendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>
                            {app.applicationDate
                              ? new Date(app.applicationDate).toLocaleDateString()
                              : "Unknown"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full capitalize ${getStatusBadgeClasses(
                            app.status
                          )}`}
                        >
                          {formatStatus(app.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {app.resumePath || app.resume ? (
                          <button
                            onClick={() => handleDownloadResume(app)}
                            disabled={downloadLoadingId === app.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded text-blue-700 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50"
                          >
                            {downloadLoadingId === app.id ? (
                              <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <FiDownload className="w-3 h-3" />
                            )}
                            Download
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                            No resume
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => handleViewDetails(app)}
                            className="p-1.5 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30"
                            title="View Full Application Details"
                            aria-label={`View details for ${app.applicantName}`}
                          >
                            <FiEye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenStatusModal(app)}
                            className="p-1.5 text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300 rounded hover:bg-yellow-50 dark:hover:bg-yellow-900/30"
                            title="Update Application Status"
                            aria-label={`Change status for ${app.applicantName}`}
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(app)}
                            className="p-1.5 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 rounded hover:bg-red-50 dark:hover:bg-red-900/30"
                            title="Delete Application"
                            aria-label={`Delete application for ${app.applicantName}`}
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {(pagination.currentPage - 1) * limit + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {Math.min(pagination.currentPage * limit, pagination.totalApplications)}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {pagination.totalApplications}
                </span>{" "}
                applications
              </div>

              <div className="inline-flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!pagination.hasPrev || pagination.currentPage <= 1 || loading}
                  className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-300 px-2">
                  Page {pagination.currentPage} of {Math.max(1, pagination.totalPages)}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!pagination.hasNext || pagination.currentPage >= pagination.totalPages || loading}
                  className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Application Details Modal */}
      {showDetailsModal && selectedApplication && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4">
          <div className="relative bg-white dark:bg-gray-800 rounded-xl max-w-3xl w-full p-6 shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold">
                  {selectedApplication.applicantName?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {selectedApplication.applicantName}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Application #{selectedApplication.id} • Applied on{" "}
                    {new Date(selectedApplication.applicationDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                aria-label="Close dialog"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-5 max-h-[70vh] overflow-y-auto pr-1">
              {/* Applicant & Job Overview Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Applicant Box */}
                <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg space-y-2.5 border border-gray-200 dark:border-gray-700 text-sm">
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FiUser className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    Applicant Information
                  </h4>
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Full Name</span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedApplication.applicantName}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Email Address</span>
                    <p className="text-gray-900 dark:text-white flex items-center gap-1">
                      <FiMail className="w-3.5 h-3.5 text-gray-400" />
                      {selectedApplication.applicantEmail}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Phone Number</span>
                    <p className="text-gray-900 dark:text-white flex items-center gap-1">
                      <FiPhone className="w-3.5 h-3.5 text-gray-400" />
                      {selectedApplication.applicantPhone || "Not provided"}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Expected Salary</span>
                      <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1">
                        <FiDollarSign className="w-3 h-3 text-gray-400" />
                        {selectedApplication.expectedSalary || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Availability</span>
                      <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1">
                        <FiClock className="w-3 h-3 text-gray-400" />
                        {selectedApplication.availability || "Immediate"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Job Info Box */}
                <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg space-y-2.5 border border-gray-200 dark:border-gray-700 text-sm">
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FiBriefcase className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    Target Job Listing
                  </h4>
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Job Title</span>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {selectedApplication.job?.title || `Job ID #${selectedApplication.jobId}`}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Company</span>
                    <p className="text-gray-900 dark:text-white">
                      {selectedApplication.job?.company || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Location</span>
                    <p className="text-gray-900 dark:text-white">
                      {selectedApplication.job?.location || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Current Status</span>
                    <div className="mt-1">
                      <span
                        className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full capitalize ${getStatusBadgeClasses(
                          selectedApplication.status
                        )}`}
                      >
                        {formatStatus(selectedApplication.status)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Skills
                </h4>
                {renderSkills(selectedApplication.skills)}
              </div>

              {/* Cover Letter */}
              {selectedApplication.coverLetter && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Cover Letter
                  </h4>
                  <div className="text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-700/30 p-3.5 rounded-lg border border-gray-200 dark:border-gray-700 whitespace-pre-line">
                    {selectedApplication.coverLetter}
                  </div>
                </div>
              )}

              {/* Experience & Education */}
              {(selectedApplication.experience || selectedApplication.education) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {selectedApplication.experience && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                        Experience Summary
                      </h4>
                      <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 whitespace-pre-line">
                        {selectedApplication.experience}
                      </div>
                    </div>
                  )}
                  {selectedApplication.education && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                        Education Background
                      </h4>
                      <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 whitespace-pre-line">
                        {selectedApplication.education}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Reviewer / Admin Notes */}
              {selectedApplication.notes && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Internal Reviewer Notes
                  </h4>
                  <div className="text-sm text-yellow-900 dark:text-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800 whitespace-pre-line">
                    {selectedApplication.notes}
                  </div>
                </div>
              )}

              {/* Resume download box */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Candidate Resume
                </h4>
                {selectedApplication.resumePath || selectedApplication.resume ? (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50/60 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                    <div className="flex items-center gap-2">
                      <FiFileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedApplication.resumePath ? selectedApplication.resumePath.split(/[/\\]/).pop() : "resume.pdf"}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDownloadResume(selectedApplication)}
                      disabled={downloadLoadingId === selectedApplication.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                    >
                      {downloadLoadingId === selectedApplication.id ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <FiDownload className="w-3.5 h-3.5" />
                      )}
                      Download Actual File
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    No resume file was uploaded with this application.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  handleOpenStatusModal(selectedApplication);
                }}
                className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-yellow-600 hover:bg-yellow-700 transition-colors flex items-center gap-1.5"
              >
                <FiEdit2 className="w-4 h-4" /> Change Status
              </button>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && selectedApplication && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4">
          <div className="relative bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Update Application Status
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Select a valid backend pipeline status for candidate{" "}
              <strong className="text-gray-900 dark:text-white">
                {selectedApplication.applicantName}
              </strong>.
            </p>

            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">
                  Pipeline Status *
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="pending">Pending</option>
                  <option value="under_review">Under Review</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="interview_scheduled">Interview Scheduled</option>
                  <option value="interviewed">Interviewed</option>
                  <option value="offered">Job Offered</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                  <option value="withdrawn">Withdrawn</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">
                  Reviewer Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Add internal evaluation feedback or notes..."
                  value={reviewerNotes}
                  onChange={(e) => setReviewerNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateStatus}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 rounded-lg flex items-center gap-2"
              >
                {actionLoading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Confirm Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Application Modal */}
      {showDeleteModal && selectedApplication && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4">
          <div className="relative bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-3">
              <FiAlertCircle className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Delete Application
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Are you sure you want to delete the application submitted by{" "}
              <strong className="text-gray-900 dark:text-white">
                {selectedApplication.applicantName}
              </strong>{" "}
              for{" "}
              <strong className="text-gray-900 dark:text-white">
                {selectedApplication.job?.title || "this job"}
              </strong>? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteApplication}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg flex items-center gap-2"
              >
                {actionLoading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Delete Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationsManagement;
