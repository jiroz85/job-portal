import React, { useState, useEffect, useCallback } from "react";
import {
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiCheck,
  FiX,
  FiAlertCircle,
  FiCheckCircle,
  FiRefreshCw,
  FiMapPin,
  FiBriefcase,
  FiDollarSign,
  FiCalendar,
  FiUser,
  FiChevronDown,
} from "react-icons/fi";
import jobApi from "../../services/jobApi";

const JobsManagement = () => {
  // Query state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [approvalFilter, setApprovalFilter] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 10;

  // Data & loading state
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalJobs: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals state
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Selected item & action state
  const [selectedJob, setSelectedJob] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    type: "Full-time",
    experience: "Entry Level",
    salary: "",
    status: "Published",
    approvalStatus: "approved",
    description: "",
    requirements: "",
    responsibilities: "",
    benefits: "",
    applicationDeadline: "",
    contactEmail: "",
    contactPhone: "",
  });

  // Notification state
  const [notification, setNotification] = useState(null); // { type: 'success' | 'error', message: string }

  const showFeedback = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  // Fetch jobs from server
  const loadJobs = useCallback(
    async (
      targetPage = page,
      search = searchTerm,
      status = statusFilter,
      approval = approvalFilter
    ) => {
      setLoading(true);
      setError(null);
      try {
        const response = await jobApi.getAllJobsAdmin({
          page: targetPage,
          limit,
          search,
          status,
          approvalStatus: approval,
        });

        if (response.success) {
          const jobData = response.data?.jobs || [];
          setJobs(jobData);
          setPagination(
            response.data?.pagination || {
              currentPage: targetPage,
              totalPages: 1,
              totalJobs: jobData.length,
              hasNext: false,
              hasPrev: false,
            }
          );
        } else {
          throw new Error(response.error || "Failed to load jobs");
        }
      } catch (err) {
        console.error("Error loading jobs:", err);
        setError(err.response?.data?.error || err.message || "Failed to load jobs from database");
      } finally {
        setLoading(false);
      }
    },
    [page, searchTerm, statusFilter, approvalFilter]
  );

  // Debounced search & filter trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      loadJobs(page, searchTerm, statusFilter, approvalFilter);
    }, 300);

    return () => clearTimeout(timer);
  }, [loadJobs, page, searchTerm, statusFilter, approvalFilter]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const handleApprovalFilterChange = (e) => {
    setApprovalFilter(e.target.value);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setApprovalFilter("all");
    setPage(1);
  };

  const getStatusBadgeClasses = (status) => {
    switch (status) {
      case "active":
      case "Published":
        return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300";
      case "Draft":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300";
      case "Closed":
        return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";
      case "filled":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300";
      case "inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getApprovalBadgeClasses = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  // View details
  const handleViewJob = (job) => {
    setSelectedJob(job);
    setShowViewModal(true);
  };

  // Edit job open
  const handleOpenEdit = (job) => {
    setSelectedJob(job);
    setFormData({
      title: job.title || "",
      company: job.company || "",
      location: job.location || "",
      type: job.type || "Full-time",
      experience: job.experience || "Entry Level",
      salary: job.salary || "",
      status: job.status || "Published",
      approvalStatus: job.approvalStatus || "approved",
      description: job.description || "",
      requirements: job.requirements || "",
      responsibilities: job.responsibilities || "",
      benefits: job.benefits || "",
      applicationDeadline: job.applicationDeadline
        ? new Date(job.applicationDeadline).toISOString().split("T")[0]
        : "",
      contactEmail: job.contactEmail || "",
      contactPhone: job.contactPhone || "",
    });
    setShowEditModal(true);
  };

  // Edit job submit
  const handleUpdateJob = async (e) => {
    e?.preventDefault();
    if (!selectedJob) return;
    setActionLoading(true);
    try {
      const response = await jobApi.updateJob(selectedJob.id, formData);
      if (!response.success) {
        throw new Error(response.error || "Failed to update job");
      }
      showFeedback("success", `Job "${formData.title}" updated successfully`);
      setShowEditModal(false);
      setSelectedJob(null);
      loadJobs();
    } catch (err) {
      console.error("Error updating job:", err);
      showFeedback("error", err.response?.data?.error || err.message || "Failed to update job");
    } finally {
      setActionLoading(false);
    }
  };

  // Add job open
  const handleOpenAdd = () => {
    setFormData({
      title: "",
      company: "",
      location: "",
      type: "Full-time",
      experience: "Entry Level",
      salary: "",
      status: "Published",
      approvalStatus: "approved",
      description: "",
      requirements: "",
      responsibilities: "",
      benefits: "",
      applicationDeadline: "",
      contactEmail: "",
      contactPhone: "",
    });
    setShowAddModal(true);
  };

  // Add job submit
  const handleCreateJob = async (e) => {
    e?.preventDefault();
    setActionLoading(true);
    try {
      const response = await jobApi.createJob(formData);
      if (!response.success) {
        throw new Error(response.error || "Failed to create job");
      }
      showFeedback("success", `Job "${formData.title}" created successfully`);
      setShowAddModal(false);
      loadJobs();
    } catch (err) {
      console.error("Error creating job:", err);
      showFeedback("error", err.response?.data?.error || err.message || "Failed to create job");
    } finally {
      setActionLoading(false);
    }
  };

  // Status moderation actions
  const handleApproveJob = async (job) => {
    setActionLoading(true);
    try {
      const updates = { approvalStatus: "approved" };
      const shouldPublish = !["Closed", "inactive", "filled"].includes(job.status);
      if (shouldPublish) {
        updates.status = "Published";
      }

      await jobApi.updateJobStatus(job.id, updates);
      showFeedback(
        "success",
        shouldPublish
          ? `Job "${job.title}" has been approved and published`
          : `Job "${job.title}" has been approved (status remains ${job.status})`
      );
      loadJobs();
      if (showViewModal) setShowViewModal(false);
    } catch (err) {
      console.error("Error approving job:", err);
      showFeedback("error", err.response?.data?.error || "Failed to approve job");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectJob = async (job) => {
    setActionLoading(true);
    try {
      await jobApi.updateJobStatus(job.id, {
        approvalStatus: "rejected",
        status: "Closed",
      });
      showFeedback("success", `Job "${job.title}" has been rejected and closed`);
      loadJobs();
      if (showViewModal) setShowViewModal(false);
    } catch (err) {
      console.error("Error rejecting job:", err);
      showFeedback("error", err.response?.data?.error || "Failed to reject job");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete modal open
  const handleOpenDelete = (job) => {
    setSelectedJob(job);
    setShowDeleteModal(true);
  };

  // Delete job submit
  const handleDeleteJob = async () => {
    if (!selectedJob) return;
    setActionLoading(true);
    try {
      const response = await jobApi.deleteJob(selectedJob.id);
      if (!response.success) {
        throw new Error(response.error || "Failed to delete job");
      }
      showFeedback("success", `Job "${selectedJob.title}" has been deleted`);
      setShowDeleteModal(false);
      setSelectedJob(null);
      loadJobs();
    } catch (err) {
      console.error("Error deleting job:", err);
      showFeedback("error", err.response?.data?.error || "Failed to delete job");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            Job Moderation & Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
            Review, approve, publish, edit, or remove job listings across the platform.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadJobs()}
            disabled={loading}
            className="inline-flex items-center px-3.5 py-2 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-colors"
          >
            <FiRefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors"
          >
            <FiPlus className="w-4 h-4 mr-2" />
            Add New Job
          </button>
        </div>
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

      {/* Filters and Search Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by title, company, or location..."
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
          <div className="w-full md:w-48 relative">
            <select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              className="w-full appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="Published">Published</option>
              <option value="active">Active</option>
              <option value="Draft">Draft</option>
              <option value="Closed">Closed</option>
              <option value="filled">Filled</option>
              <option value="inactive">Inactive</option>
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-4 h-4" />
          </div>

          {/* Approval Filter */}
          <div className="w-full md:w-48 relative">
            <select
              value={approvalFilter}
              onChange={handleApprovalFilterChange}
              className="w-full appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Approvals</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending Review</option>
              <option value="rejected">Rejected</option>
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading jobs from database...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <FiAlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <p className="text-base font-semibold text-gray-900 dark:text-white">Unable to load jobs</p>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1 mb-4">{error}</p>
            <button
              onClick={() => loadJobs()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-12 text-center">
            <FiBriefcase className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-base font-medium text-gray-900 dark:text-white">No jobs found</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">
              {searchTerm || statusFilter !== "all" || approvalFilter !== "all"
                ? "No job listings match your search or filter criteria."
                : "No jobs currently exist in the database."}
            </p>
            {(searchTerm || statusFilter !== "all" || approvalFilter !== "all") && (
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
                      Job Title & Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Location & Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Moderation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Posted
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {jobs.map((job) => (
                    <tr
                      key={job.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-sm">
                            <FiBriefcase className="w-5 h-5" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                              {job.title}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {job.company}
                              {job.employer && (
                                <span className="text-xs text-gray-400 ml-1">
                                  ({job.employer.name || job.employer.email})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white flex items-center gap-1">
                          <FiMapPin className="w-3.5 h-3.5 text-gray-400" />
                          <span>{job.location}</span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {job.type} • {job.experience || "Not specified"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full capitalize ${getStatusBadgeClasses(
                            job.status
                          )}`}
                        >
                          {job.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full capitalize ${getApprovalBadgeClasses(
                            job.approvalStatus
                          )}`}
                        >
                          {job.approvalStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1.5">
                          <FiCalendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>
                            {job.createdAt
                              ? new Date(job.createdAt).toLocaleDateString()
                              : "Unknown"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => handleViewJob(job)}
                            className="p-1.5 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30"
                            title="View Full Job Details"
                            aria-label={`View details for ${job.title}`}
                          >
                            <FiEye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(job)}
                            className="p-1.5 text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                            title="Edit Job"
                            aria-label={`Edit ${job.title}`}
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </button>

                          {job.approvalStatus !== "approved" && (
                            <button
                              onClick={() => handleApproveJob(job)}
                              disabled={actionLoading}
                              className="p-1.5 text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 rounded hover:bg-green-50 dark:hover:bg-green-900/30"
                              title={
                                ["Closed", "inactive", "filled"].includes(job.status)
                                  ? "Approve Job"
                                  : "Approve & Publish Job"
                              }
                              aria-label={`Approve ${job.title}`}
                            >
                              <FiCheck className="w-4 h-4" />
                            </button>
                          )}

                          {job.approvalStatus !== "rejected" && (
                            <button
                              onClick={() => handleRejectJob(job)}
                              disabled={actionLoading}
                              className="p-1.5 text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300 rounded hover:bg-yellow-50 dark:hover:bg-yellow-900/30"
                              title="Reject & Close Job"
                              aria-label={`Reject ${job.title}`}
                            >
                              <FiX className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenDelete(job)}
                            className="p-1.5 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 rounded hover:bg-red-50 dark:hover:bg-red-900/30"
                            title="Delete Job"
                            aria-label={`Delete ${job.title}`}
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
                  {Math.min(pagination.currentPage * limit, pagination.totalJobs)}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {pagination.totalJobs}
                </span>{" "}
                jobs
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

      {/* View Job Details Modal */}
      {showViewModal && selectedJob && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4">
          <div className="relative bg-white dark:bg-gray-800 rounded-xl max-w-3xl w-full p-6 shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {selectedJob.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {selectedJob.company} • Job ID #{selectedJob.id}
                </p>
              </div>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                aria-label="Close dialog"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-5 max-h-[70vh] overflow-y-auto pr-1">
              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-gray-50 dark:bg-gray-700/40 p-3.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm">
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Location</span>
                  <p className="font-medium text-gray-900 dark:text-white flex items-center gap-1 mt-0.5">
                    <FiMapPin className="w-3.5 h-3.5 text-gray-400" />
                    {selectedJob.location}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Job Type</span>
                  <p className="font-medium text-gray-900 dark:text-white mt-0.5">
                    {selectedJob.type}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Experience</span>
                  <p className="font-medium text-gray-900 dark:text-white mt-0.5">
                    {selectedJob.experience || "Not specified"}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Salary</span>
                  <p className="font-medium text-gray-900 dark:text-white flex items-center gap-1 mt-0.5">
                    <FiDollarSign className="w-3.5 h-3.5 text-gray-400" />
                    {selectedJob.salary || "Not specified"}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Listing Status</span>
                  <div className="mt-0.5">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full capitalize ${getStatusBadgeClasses(selectedJob.status)}`}>
                      {selectedJob.status}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Moderation Status</span>
                  <div className="mt-0.5">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full capitalize ${getApprovalBadgeClasses(selectedJob.approvalStatus)}`}>
                      {selectedJob.approvalStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Employer Info if assigned */}
              {selectedJob.employer && (
                <div className="p-3 bg-blue-50/60 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 text-sm">
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1">
                    <FiUser className="w-3.5 h-3.5" /> Posting Employer
                  </span>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {selectedJob.employer.name} ({selectedJob.employer.email})
                  </p>
                </div>
              )}

              {/* Description */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                  Job Description
                </h4>
                <div className="text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-700/30 p-3.5 rounded-lg border border-gray-200 dark:border-gray-700 whitespace-pre-line">
                  {selectedJob.description}
                </div>
              </div>

              {/* Requirements */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                  Requirements
                </h4>
                <div className="text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-700/30 p-3.5 rounded-lg border border-gray-200 dark:border-gray-700 whitespace-pre-line">
                  {selectedJob.requirements}
                </div>
              </div>

              {/* Responsibilities if present */}
              {selectedJob.responsibilities && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                    Responsibilities
                  </h4>
                  <div className="text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-700/30 p-3.5 rounded-lg border border-gray-200 dark:border-gray-700 whitespace-pre-line">
                    {selectedJob.responsibilities}
                  </div>
                </div>
              )}

              {/* Contact & Deadline Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Application Deadline</span>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">
                    {selectedJob.applicationDeadline
                      ? new Date(selectedJob.applicationDeadline).toLocaleDateString()
                      : "No deadline specified"}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Contact Email / Phone</span>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">
                    {selectedJob.contactEmail || "None"} {selectedJob.contactPhone ? `• ${selectedJob.contactPhone}` : ""}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {selectedJob.approvalStatus !== "approved" && (
                  <button
                    onClick={() => handleApproveJob(selectedJob)}
                    disabled={actionLoading}
                    className="px-3.5 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-1.5"
                  >
                    <FiCheck className="w-4 h-4" />{" "}
                    {["Closed", "inactive", "filled"].includes(selectedJob.status)
                      ? "Approve"
                      : "Approve & Publish"}
                  </button>
                )}
                {selectedJob.approvalStatus !== "rejected" && (
                  <button
                    onClick={() => handleRejectJob(selectedJob)}
                    disabled={actionLoading}
                    className="px-3.5 py-1.5 text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 rounded-lg flex items-center gap-1.5"
                  >
                    <FiX className="w-4 h-4" /> Reject & Close
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Job Modal */}
      {showEditModal && selectedJob && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4">
          <div className="relative bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6 shadow-xl border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Edit Job Listing
            </h3>
            <form onSubmit={handleUpdateJob} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Salary Range
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. $80,000 - $100,000"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Job Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                    <option value="Temporary">Temporary</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Experience Level
                  </label>
                  <select
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Entry Level">Entry Level</option>
                    <option value="Mid Level">Mid Level</option>
                    <option value="Senior Level">Senior Level</option>
                    <option value="Lead">Lead</option>
                    <option value="Manager">Manager</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Listing Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Published">Published</option>
                    <option value="active">Active</option>
                    <option value="Draft">Draft</option>
                    <option value="Closed">Closed</option>
                    <option value="filled">Filled</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Approval Status
                  </label>
                  <select
                    value={formData.approvalStatus}
                    onChange={(e) => setFormData({ ...formData, approvalStatus: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Job Description *
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Requirements *
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  disabled={actionLoading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg flex items-center gap-2"
                >
                  {actionLoading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Job Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4">
          <div className="relative bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6 shadow-xl border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Add New Job Listing
            </h3>
            <form onSubmit={handleCreateJob} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Salary Range
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. $70,000 - $90,000"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Job Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                    <option value="Temporary">Temporary</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Experience Level
                  </label>
                  <select
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Entry Level">Entry Level</option>
                    <option value="Mid Level">Mid Level</option>
                    <option value="Senior Level">Senior Level</option>
                    <option value="Lead">Lead</option>
                    <option value="Manager">Manager</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Job Description *
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Requirements *
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={actionLoading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg flex items-center gap-2"
                >
                  {actionLoading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  Create Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedJob && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4">
          <div className="relative bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-3">
              <FiAlertCircle className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Delete Job Listing
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Are you sure you want to permanently delete{" "}
              <strong className="text-gray-900 dark:text-white">{selectedJob.title}</strong> at{" "}
              <strong className="text-gray-900 dark:text-white">{selectedJob.company}</strong>? This action cannot be undone and will remove all applications submitted for this job.
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
                onClick={handleDeleteJob}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg flex items-center gap-2"
              >
                {actionLoading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Delete Job
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobsManagement;
